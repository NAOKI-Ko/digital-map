import { isMapLocale, mapLanguageOptions, orderedMapLocales } from '~~/shared/constants/map-languages'

export default defineEventHandler(async (event) => {
  const { map } = await requireMapAccess(event)
  const config = await prisma.map.findFirst({
    where: { id: map.id },
    select: { defaultLocale: true, enabledLocales: true },
  })
  if (!config || !isMapLocale(config.defaultLocale)) throw createError({ statusCode: 404, statusMessage: '言語設定が見つかりません。' })
  return {
    defaultLocale: config.defaultLocale,
    enabledLocales: orderedMapLocales(config.defaultLocale, config.enabledLocales),
    supportedLocales: mapLanguageOptions,
  }
})
