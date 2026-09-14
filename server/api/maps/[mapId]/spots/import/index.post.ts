import type { SpotCsvImportResponse } from '~~/shared/types/spot-csv'
import { loadSpotCsvContext, previewSpotCsv } from '~~/server/utils/spot-csv'

export default defineEventHandler(async (event): Promise<SpotCsvImportResponse> => {
  const { map } = await requireOwnedMap(event)
  const body = await readBody<{ floorId?: string, csv?: string }>(event)
  if (!body.floorId || typeof body.csv !== 'string') throw createError({ statusCode: 422, statusMessage: 'フロアとCSVを指定してください。' })

  const createdCount = await prisma.$transaction(async (transaction) => {
    const context = await loadSpotCsvContext(transaction, map.id, body.floorId!)
    const result = previewSpotCsv(body.csv!, context.fields, context.categories, context.existingNames, context.enabledLocales)
    if (result.preview.errors > 0) throw createError({ statusCode: 422, statusMessage: 'エラーのあるCSVは登録できません。' })
    for (const row of result.parsedRows) {
      const standard = row.standardValues
      const spot = await transaction.spot.create({
        data: {
          floorId: context.floor.id,
          name: row.name,
          description: standard.description || null,
          address: standard.address || null,
          website: standard.website || null,
          hoursText: standard.hours || null,
          holidayText: standard.holiday || null,
          phone: standard.phone || null,
          x: null,
          y: null,
          isPublished: false,
          spotCategories: { create: row.categoryIds.map(categoryId => ({ categoryId })) },
          fieldValues: { create: Object.entries(row.customValues).map(([fieldDefinitionId, valueJson]) => ({ fieldDefinitionId, valueJson })) },
        },
      })
      const englishCore = row.englishStandardValues
      if (row.englishName || Object.keys(englishCore).length) {
        await transaction.spotTranslation.create({ data: {
          spotId: spot.id,
          locale: 'en',
          name: row.englishName || null,
          description: englishCore.description || null,
          address: englishCore.address || null,
          hoursText: englishCore.hours || null,
          holidayText: englishCore.holiday || null,
        } })
      }
      if (Object.keys(row.englishCustomValues).length) await transaction.spotFieldValueTranslation.createMany({ data: Object.entries(row.englishCustomValues).map(([fieldDefinitionId, value]) => ({ spotId: spot.id, fieldDefinitionId, locale: 'en', value })) })
    }
    return result.parsedRows.length
  })
  return { createdCount }
})
