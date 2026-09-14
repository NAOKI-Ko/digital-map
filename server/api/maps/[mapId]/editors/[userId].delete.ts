export default defineEventHandler(async (event) => {
  const access = await requireMapAccess(event)
  await requireTenantOwner(event, access.map.tenantId)
  const userId = getRouterParam(event, 'userId')
  if (!userId) throw createError({ statusCode: 400, statusMessage: 'ユーザーIDが必要です。' })
  await prisma.$transaction(async (tx) => {
    const assignments = await tx.mapMember.findMany({ where: { mapId: access.map.id, userId }, select: { id: true } })
    await tx.mapMember.deleteMany({ where: { mapId: access.map.id, userId } })
    for (const assignment of assignments) await appendAuditEvent(tx, { tenantId: access.map.tenantId, actorUserId: access.session.user.id, action: 'MAP_EDITOR_REMOVED', targetType: 'MapMember', targetId: assignment.id, mapId: access.map.id, metadata: { userId } })
  })
  return { removedUserId: userId }
})
