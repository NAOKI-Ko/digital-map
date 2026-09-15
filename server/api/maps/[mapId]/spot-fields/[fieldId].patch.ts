import { spotFieldUpdateSchema } from '~~/shared/schemas/spot-field'
import type { SpotFieldDefinitionResponse } from '~~/shared/types/spot-field'
import { isMapLocale, orderedMapLocales } from '~~/shared/constants/map-languages'

export default defineEventHandler(async (event): Promise<SpotFieldDefinitionResponse> => {
  const { map } = await requireOwnedMap(event)
  const owned = await requireOwnedSpotField(map.id, getRouterParam(event, 'fieldId'))
  const result = spotFieldUpdateSchema.safeParse(await readBody(event))
  if (!result.success) throw createError({ statusCode: 422, statusMessage: result.error.issues[0]?.message ?? '項目を確認してください。' })
  if (owned.kind === 'standard' && result.data.type && result.data.type !== owned.type) {
    throw createError({ statusCode: 422, statusMessage: '標準項目の種類は変更できません。' })
  }
  if (owned.kind === 'custom' && owned._count.values > 0 && result.data.type && result.data.type !== owned.type) {
    throw createError({ statusCode: 409, statusMessage: '値が登録済みのカスタム項目は種類を変更できません。' })
  }
  const config = await prisma.map.findUniqueOrThrow({ where: { id: map.id }, select: { defaultLocale: true, enabledLocales: true } })
  const defaultLocale = isMapLocale(config.defaultLocale) ? config.defaultLocale : 'ja'
  const enabledLocales = orderedMapLocales(defaultLocale, config.enabledLocales)
  const translations = result.data.translations
  const invalidLocale = translations && Object.keys(translations).find(locale => locale === defaultLocale || !enabledLocales.includes(locale as typeof enabledLocales[number]))
  if (invalidLocale) throw createError({ statusCode: 422, statusMessage: '有効な追加言語だけを指定してください。' })
  const { translations: _translations, ...settings } = result.data
  const data = {
    ...settings,
    ...(result.data.enabled === false ? { publicVisible: false } : {}),
  }
  const field = await prisma.$transaction(async (transaction) => {
    await transaction.spotFieldDefinition.update({ where: { id: owned.id }, data })
    for (const [locale, label] of Object.entries(translations ?? {})) {
      if (!label?.trim()) await transaction.spotFieldDefinitionTranslation.deleteMany({ where: { fieldDefinitionId: owned.id, locale } })
      else await transaction.spotFieldDefinitionTranslation.upsert({
        where: { fieldDefinitionId_locale: { fieldDefinitionId: owned.id, locale } },
        create: { fieldDefinitionId: owned.id, locale, label },
        update: { label },
      })
    }
    return transaction.spotFieldDefinition.findUniqueOrThrow({
      where: { id: owned.id },
      include: { _count: { select: { values: true } }, translations: { select: { locale: true, label: true } } },
    })
  })
  return { field: toSpotFieldDefinition(field) }
})
