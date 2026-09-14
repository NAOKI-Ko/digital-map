import { nameTranslationSchema } from '~~/shared/schemas/translations'

export default defineEventHandler(async (event) => {
  const { map } = await requireMapAccess(event)
  const categoryId = getRouterParam(event, 'categoryId')
  const category = await prisma.category.findFirst({ where: { id: categoryId, mapId: map.id }, select: { id: true } })
  if (!category) throw createError({ statusCode: 404, statusMessage: 'カテゴリーが見つかりません。' })
  const result = nameTranslationSchema.safeParse(await readBody(event))
  if (!result.success) throw createError({ statusCode: 422, statusMessage: result.error.issues[0]?.message ?? '翻訳を確認してください。' })
  if (!result.data.name) await prisma.categoryTranslation.deleteMany({ where: { categoryId: category.id, locale: 'en' } })
  else await prisma.categoryTranslation.upsert({ where: { categoryId_locale: { categoryId: category.id, locale: 'en' } }, create: { categoryId: category.id, locale: 'en', name: result.data.name }, update: { name: result.data.name } })
  return { locale: 'en', name: result.data.name || null }
})
