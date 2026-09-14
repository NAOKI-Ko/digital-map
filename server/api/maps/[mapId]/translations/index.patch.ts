import { mapTranslationSchema } from '~~/shared/schemas/translations'

export default defineEventHandler(async (event) => {
  const { map } = await requireMapAccess(event)
  const result = mapTranslationSchema.safeParse(await readBody(event))
  if (!result.success) throw createError({ statusCode: 422, statusMessage: result.error.issues[0]?.message ?? '翻訳を確認してください。' })
  const { englishEnabled, name, description } = result.data
  await prisma.$transaction(async (transaction) => {
    await transaction.map.update({ where: { id: map.id }, data: { defaultLocale: 'ja', enabledLocales: englishEnabled ? ['ja', 'en'] : ['ja'] } })
    if (englishEnabled && (name || description)) {
      await transaction.mapTranslation.upsert({
        where: { mapId_locale: { mapId: map.id, locale: 'en' } },
        create: { mapId: map.id, locale: 'en', name: name || null, description: description || null },
        update: { name: name || null, description: description || null },
      })
    }
    else if (!englishEnabled) await transaction.mapTranslation.deleteMany({ where: { mapId: map.id, locale: 'en' } })
  })
  return { defaultLocale: 'ja', enabledLocales: englishEnabled ? ['ja', 'en'] : ['ja'], translation: englishEnabled ? { name: name || null, description: description || null } : null }
})
