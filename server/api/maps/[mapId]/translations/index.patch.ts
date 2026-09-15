import { mapTranslationSchema } from '~~/shared/schemas/translations'
import { isMapLocale, orderedMapLocales } from '~~/shared/constants/map-languages'

export default defineEventHandler(async (event) => {
  const { map } = await requireMapAccess(event)
  const result = mapTranslationSchema.safeParse(await readBody(event))
  if (!result.success) throw createError({ statusCode: 422, statusMessage: result.error.issues[0]?.message ?? '翻訳を確認してください。' })
  const { englishEnabled, name, description } = result.data
  const config = await prisma.map.findUniqueOrThrow({ where: { id: map.id }, select: { defaultLocale: true, enabledLocales: true } })
  const defaultLocale = isMapLocale(config.defaultLocale) ? config.defaultLocale : 'ja'
  if (defaultLocale === 'en' && !englishEnabled) throw createError({ statusCode: 422, statusMessage: '既定言語は削除できません。' })
  const enabledLocales = orderedMapLocales(defaultLocale, englishEnabled
    ? [...config.enabledLocales, 'en']
    : config.enabledLocales.filter(locale => locale !== 'en'))
  await prisma.$transaction(async (transaction) => {
    await transaction.map.update({ where: { id: map.id }, data: { defaultLocale, enabledLocales } })
    if (englishEnabled && (name || description)) {
      await transaction.mapTranslation.upsert({
        where: { mapId_locale: { mapId: map.id, locale: 'en' } },
        create: { mapId: map.id, locale: 'en', name: name || null, description: description || null },
        update: { name: name || null, description: description || null },
      })
    }
  })
  return { defaultLocale, enabledLocales, translation: englishEnabled ? { name: name || null, description: description || null } : null }
})
