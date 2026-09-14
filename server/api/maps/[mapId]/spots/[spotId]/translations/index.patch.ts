import { spotTranslationSchema } from '~~/shared/schemas/translations'

export default defineEventHandler(async (event) => {
  const { map, spot } = await requireOwnedSpot(event)
  const result = spotTranslationSchema.safeParse(await readBody(event))
  if (!result.success) throw createError({ statusCode: 422, statusMessage: result.error.issues[0]?.message ?? '翻訳を確認してください。' })
  const enabled = await prisma.map.findUnique({ where: { id: map.id }, select: { enabledLocales: true } })
  if (!enabled?.enabledLocales.includes('en')) throw createError({ statusCode: 422, statusMessage: '先にマップ設定で英語を有効にしてください。' })
  const fieldIds = Object.keys(result.data.customValues)
  const textFields = fieldIds.length
    ? await prisma.spotFieldDefinition.findMany({ where: { id: { in: fieldIds }, mapId: map.id, enabled: true, type: { in: ['single_line_text', 'multiline_text'] } }, select: { id: true } })
    : []
  if (textFields.length !== fieldIds.length) throw createError({ statusCode: 422, statusMessage: '英語訳は有効なテキスト項目にのみ設定できます。' })
  const { customValues, ...core } = result.data
  await prisma.$transaction(async (transaction) => {
    await transaction.spotTranslation.upsert({
      where: { spotId_locale: { spotId: spot.id, locale: 'en' } },
      create: { spotId: spot.id, locale: 'en', ...Object.fromEntries(Object.entries(core).map(([key, value]) => [key, value || null])) },
      update: Object.fromEntries(Object.entries(core).map(([key, value]) => [key, value || null])),
    })
    for (const [fieldDefinitionId, value] of Object.entries(customValues)) {
      if (!value) await transaction.spotFieldValueTranslation.deleteMany({ where: { spotId: spot.id, fieldDefinitionId, locale: 'en' } })
      else await transaction.spotFieldValueTranslation.upsert({
        where: { spotId_fieldDefinitionId_locale: { spotId: spot.id, fieldDefinitionId, locale: 'en' } },
        create: { spotId: spot.id, fieldDefinitionId, locale: 'en', value },
        update: { value },
      })
    }
    await transaction.spot.update({ where: { id: spot.id }, data: { liveVersion: { increment: 1 } } })
  })
  return { locale: 'en', translation: result.data }
})
