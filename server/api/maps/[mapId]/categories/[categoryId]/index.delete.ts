export default defineEventHandler(async (event) => {
  const { map, session } = await requireOwnedMap(event)
  const category = await requireOwnedCategory(map.id, map.tenantId, getRouterParam(event, 'categoryId'))
  if (category._count.spotCategories > 0) {
    throw createError({ statusCode: 409, statusMessage: '使用中のカテゴリーは削除できません。先にスポットから解除してください。' })
  }
  await prisma.$transaction(async (tx) => {
    await tx.category.delete({ where: { id: category.id } })
    await appendAuditEvent(tx, { tenantId: map.tenantId, actorUserId: session.user.id, action: 'CATEGORY_DELETED', targetType: 'Category', targetId: category.id, mapId: map.id, metadata: { usageCount: category._count.spotCategories } })
  })
  setResponseStatus(event, 204)
  return null
})
