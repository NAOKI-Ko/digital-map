import { labelTranslationSchema } from '~~/shared/schemas/translations'

export default defineEventHandler(async (event) => {
  const { map } = await requireMapAccess(event)
  const fieldId = getRouterParam(event, 'fieldId')
  const field = await prisma.spotFieldDefinition.findFirst({ where: { id: fieldId, mapId: map.id }, select: { id: true } })
  if (!field) throw createError({ statusCode: 404, statusMessage: '項目が見つかりません。' })
  const result = labelTranslationSchema.safeParse(await readBody(event))
  if (!result.success) throw createError({ statusCode: 422, statusMessage: result.error.issues[0]?.message ?? '翻訳を確認してください。' })
  const config = await prisma.map.findUniqueOrThrow({ where: { id: map.id }, select: { defaultLocale: true, enabledLocales: true } })
  if (result.data.locale === config.defaultLocale || !config.enabledLocales.includes(result.data.locale)) {
    throw createError({ statusCode: 422, statusMessage: '有効な追加言語を指定してください。' })
  }
  const locale = result.data.locale
  if (!result.data.label) await prisma.spotFieldDefinitionTranslation.deleteMany({ where: { fieldDefinitionId: field.id, locale } })
  else await prisma.spotFieldDefinitionTranslation.upsert({ where: { fieldDefinitionId_locale: { fieldDefinitionId: field.id, locale } }, create: { fieldDefinitionId: field.id, locale, label: result.data.label }, update: { label: result.data.label } })
  return { locale, label: result.data.label || null }
})
