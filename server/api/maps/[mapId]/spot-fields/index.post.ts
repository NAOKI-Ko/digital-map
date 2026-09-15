import { customSpotFieldCreateSchema } from '~~/shared/schemas/spot-field'
import type { SpotFieldDefinitionResponse } from '~~/shared/types/spot-field'
import { isMapLocale, orderedMapLocales } from '~~/shared/constants/map-languages'

export default defineEventHandler(async (event): Promise<SpotFieldDefinitionResponse> => {
  const { map } = await requireOwnedMap(event)
  const result = customSpotFieldCreateSchema.safeParse(await readBody(event))
  if (!result.success) throw createError({ statusCode: 422, statusMessage: result.error.issues[0]?.message ?? '項目を確認してください。' })
  const config = await prisma.map.findUniqueOrThrow({ where: { id: map.id }, select: { defaultLocale: true, enabledLocales: true } })
  const defaultLocale = isMapLocale(config.defaultLocale) ? config.defaultLocale : 'ja'
  const enabledLocales = orderedMapLocales(defaultLocale, config.enabledLocales)
  const invalidLocale = Object.keys(result.data.translations).find(locale => locale === defaultLocale || !enabledLocales.includes(locale as typeof enabledLocales[number]))
  if (invalidLocale) throw createError({ statusCode: 422, statusMessage: '有効な追加言語だけを指定してください。' })
  const { translations, ...settings } = result.data
  const field = await prisma.spotFieldDefinition.create({
    data: {
      mapId: map.id,
      kind: 'custom',
      semanticKey: null,
      ...settings,
      translations: {
        create: Object.entries(translations)
          .filter((entry): entry is [string, string] => Boolean(entry[1]?.trim()))
          .map(([locale, label]) => ({ locale, label })),
      },
    },
    include: { _count: { select: { values: true } }, translations: { select: { locale: true, label: true } } },
  })
  setResponseStatus(event, 201)
  return { field: toSpotFieldDefinition(field) }
})
