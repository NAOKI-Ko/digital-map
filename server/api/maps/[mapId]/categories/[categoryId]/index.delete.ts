export default defineEventHandler(async (event) => {
  const { map } = await requireOwnedMap(event)
  const category = await requireOwnedCategory(map.id, getRouterParam(event, 'categoryId'))
  if (category._count.spotCategories > 0) {
    throw createError({ statusCode: 409, statusMessage: '使用中のカテゴリーは削除できません。先にスポットから解除してください。' })
  }
  await prisma.category.delete({ where: { id: category.id } })
  setResponseStatus(event, 204)
  return null
})
