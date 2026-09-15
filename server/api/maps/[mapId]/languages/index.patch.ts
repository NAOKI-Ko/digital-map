import { isMapLocale, orderedMapLocales } from '~~/shared/constants/map-languages'
import { mapLanguagesUpdateSchema } from '~~/shared/schemas/map-languages'

export default defineEventHandler(async (event) => {
  const { map } = await requireMapAccess(event)
  const config = await prisma.map.findFirst({
    where: { id: map.id },
    select: { defaultLocale: true, enabledLocales: true },
  })
  if (!config || !isMapLocale(config.defaultLocale)) throw createError({ statusCode: 404, statusMessage: '言語設定が見つかりません。' })

  const result = mapLanguagesUpdateSchema.safeParse(await readBody(event))
  if (!result.success) throw createError({ statusCode: 422, statusMessage: result.error.issues[0]?.message ?? '言語設定を確認してください。' })
  const enabledLocales = orderedMapLocales(config.defaultLocale, result.data.enabledLocales)
  if (!result.data.enabledLocales.includes(config.defaultLocale)) {
    throw createError({ statusCode: 422, statusMessage: '既定言語は削除できません。' })
  }
  if (result.data.enabledLocales[0] !== config.defaultLocale) {
    throw createError({ statusCode: 422, statusMessage: '既定言語は言語一覧の先頭にしてください。' })
  }

  await prisma.map.update({ where: { id: map.id }, data: { enabledLocales } })
  return { defaultLocale: config.defaultLocale, enabledLocales }
})
