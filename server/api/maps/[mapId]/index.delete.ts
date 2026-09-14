export default defineEventHandler(async (event) => {
  const access = await requireMapAccess(event)
  await requireTenantOwner(event, access.map.tenantId)
  await prisma.$transaction(async (tx) => {
    await appendAuditEvent(tx, { tenantId: access.map.tenantId, actorUserId: access.session.user.id, action: 'MAP_DELETED', targetType: 'Map', targetId: access.map.id, mapId: access.map.id })
    await tx.map.delete({ where: { id: access.map.id } })
  })
  return { deletedId: access.map.id }
})
