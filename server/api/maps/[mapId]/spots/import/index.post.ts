import type { Prisma } from '~~/prisma/generated/client'
import type { SpotCsvImportResponse } from '~~/shared/types/spot-csv'
import type { ParsedSpotCsvRow } from '~~/server/utils/spot-csv'
import { loadSpotCsvContext, previewSpotCsv } from '~~/server/utils/spot-csv'

function standardSpotData(row: ParsedSpotCsvRow, fields: { kind: string, semanticKey: string | null, enabled: boolean }[]) {
  const data: { description?: string | null, address?: string | null, website?: string | null, hoursText?: string | null, holidayText?: string | null, phone?: string | null } = {}
  const enabledKeys = new Set(fields.filter(field => field.enabled && field.kind === 'standard').map(field => field.semanticKey))
  if (enabledKeys.has('description')) data.description = row.standardValues.description || null
  if (enabledKeys.has('address')) data.address = row.standardValues.address || null
  if (enabledKeys.has('website')) data.website = row.standardValues.website || null
  if (enabledKeys.has('hours')) data.hoursText = row.standardValues.hours || null
  if (enabledKeys.has('holiday')) data.holidayText = row.standardValues.holiday || null
  if (enabledKeys.has('phone')) data.phone = row.standardValues.phone || null
  return data
}

async function writeEnglishValues(transaction: Prisma.TransactionClient, spotId: string, row: ParsedSpotCsvRow, fields: { kind: string, semanticKey: string | null, enabled: boolean }[]) {
  const standard = row.englishStandardValues
  const enabledKeys = new Set(fields.filter(field => field.enabled && field.kind === 'standard').map(field => field.semanticKey))
  const data: { name: string | null, description?: string | null, address?: string | null, hoursText?: string | null, holidayText?: string | null } = { name: row.englishName || null }
  if (enabledKeys.has('description')) data.description = standard.description || null
  if (enabledKeys.has('address')) data.address = standard.address || null
  if (enabledKeys.has('hours')) data.hoursText = standard.hours || null
  if (enabledKeys.has('holiday')) data.holidayText = standard.holiday || null
  await transaction.spotTranslation.upsert({
    where: { spotId_locale: { spotId, locale: 'en' } },
    create: { spotId, locale: 'en', ...data },
    update: data,
  })

  for (const [fieldDefinitionId, value] of Object.entries(row.englishCustomValues)) {
    if (!value) await transaction.spotFieldValueTranslation.deleteMany({ where: { spotId, fieldDefinitionId, locale: 'en' } })
    else {
      await transaction.spotFieldValueTranslation.upsert({
        where: { spotId_fieldDefinitionId_locale: { spotId, fieldDefinitionId, locale: 'en' } },
        create: { spotId, fieldDefinitionId, locale: 'en', value },
        update: { value },
      })
    }
  }
}

async function writeCustomValues(transaction: Prisma.TransactionClient, spotId: string, row: ParsedSpotCsvRow) {
  for (const [fieldDefinitionId, valueJson] of Object.entries(row.customValues)) {
    if (valueJson === null || valueJson === '') await transaction.spotFieldValue.deleteMany({ where: { spotId, fieldDefinitionId } })
    else {
      await transaction.spotFieldValue.upsert({
        where: { spotId_fieldDefinitionId: { spotId, fieldDefinitionId } },
        create: { spotId, fieldDefinitionId, valueJson },
        update: { valueJson },
      })
    }
  }
}

export default defineEventHandler(async (event): Promise<SpotCsvImportResponse> => {
  const { map, session } = await requireOwnedMap(event)
  const body = await readBody<{ csv?: string }>(event)
  if (typeof body.csv !== 'string') throw createError({ statusCode: 422, statusMessage: 'CSVを指定してください。' })

  return await prisma.$transaction(async (transaction) => {
    // Reload and re-hash all editable state inside the final serializable transaction.
    const context = await loadSpotCsvContext(transaction, map.id)
    const result = previewSpotCsv(body.csv!, context.fields, context.categories, context.existingNames, context.enabledLocales, context.spots, undefined, context.floors)
    if (result.preview.conflicts > 0) throw createError({ statusCode: 409, statusMessage: '競合があります。最新CSVを再Exportしてください。変更は保存されていません。' })
    if (result.preview.errors > 0) throw createError({ statusCode: 422, statusMessage: 'エラーのあるCSVは登録できません。変更は保存されていません。' })

    const changedSpotIds: string[] = []
    for (const row of result.parsedRows) {
      if (row.status === 'UNCHANGED') continue
      if (row.status === 'NEW') {
        if (!row.floorId) throw createError({ statusCode: 422, statusMessage: `行${row.rowNumber}のフロアを特定できません。` })
        const spot = await transaction.spot.create({
          data: {
            tenantId: map.tenantId,
            floorId: row.floorId,
            name: row.name,
            ...standardSpotData(row, context.fields),
            x: null,
            y: null,
            isPublished: false,
            spotCategories: { create: row.categoryIds.map(categoryId => ({ categoryId })) },
          },
        })
        await writeCustomValues(transaction, spot.id, row)
        if (context.enabledLocales.includes('en')) await writeEnglishValues(transaction, spot.id, row, context.fields)
        changedSpotIds.push(spot.id)
      }
      else if (row.status === 'UPDATE' && row.spotId) {
        await transaction.spot.update({
          where: { id: row.spotId },
          data: {
            name: row.name,
            ...standardSpotData(row, context.fields),
            liveVersion: { increment: 1 },
            spotCategories: { deleteMany: {}, create: row.categoryIds.map(categoryId => ({ categoryId })) },
          },
        })
        await writeCustomValues(transaction, row.spotId, row)
        if (context.enabledLocales.includes('en')) await writeEnglishValues(transaction, row.spotId, row, context.fields)
        changedSpotIds.push(row.spotId)
      }
    }

    if (changedSpotIds.length) {
      await appendAuditEvent(transaction, {
        tenantId: map.tenantId,
        actorUserId: session.user.id,
        action: 'SPOT_CSV_BULK_APPLIED',
        targetType: 'Map',
        targetId: map.id,
        mapId: map.id,
        metadata: {
          createCount: result.preview.newCount,
          updateCount: result.preview.updateCount,
          unchangedCount: result.preview.unchangedCount,
          changedSpotIds: changedSpotIds.slice(0, 20),
          changedSpotIdCount: changedSpotIds.length,
        },
      })
    }
    return { createdCount: result.preview.newCount, updatedCount: result.preview.updateCount, unchangedCount: result.preview.unchangedCount }
  }, { isolationLevel: 'Serializable' })
})
