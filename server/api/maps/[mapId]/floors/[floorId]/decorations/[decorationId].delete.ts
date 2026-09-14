export default defineEventHandler(async (event) => {
  const { floor, map, session } = await requireOwnedFloor(event)
  const id = getRouterParam(event, 'decorationId')
  const result = await prisma.$transaction(async (tx) => {
    const deleted = await tx.floorDecoration.deleteMany({ where: { id, floorId: floor.id } })
    if (deleted.count && id) await appendAuditEvent(tx, { tenantId: map.tenantId, actorUserId: session.user.id, action: 'DECORATION_DELETED', targetType: 'FloorDecoration', targetId: id, mapId: map.id, metadata: { floorId: floor.id } })
    return deleted
  })
  if (!result.count) throw createError({ statusCode: 404, statusMessage: 'Decorationが見つかりません。' })
  setResponseStatus(event, 204)
  return null
})
