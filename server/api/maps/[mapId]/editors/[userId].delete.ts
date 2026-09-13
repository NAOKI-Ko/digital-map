export default defineEventHandler(async (event) => {
  const access = await requireMapAccess(event)
  await requireTenantOwner(event, access.map.tenantId)
  const userId = getRouterParam(event, 'userId')
  if (!userId) throw createError({ statusCode: 400, statusMessage: 'ユーザーIDが必要です。' })
  await prisma.mapMember.deleteMany({ where: { mapId: access.map.id, userId } })
  return { removedUserId: userId }
})
