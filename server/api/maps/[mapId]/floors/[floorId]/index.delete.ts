export default defineEventHandler(async (event) => {
  const { map, floor, session } = await requireOwnedFloor(event)

  await prisma.$transaction(async (transaction) => {
    await transaction.mapFloor.delete({ where: { id: floor.id } })
    await appendAuditEvent(transaction, { tenantId: map.tenantId, actorUserId: session.user.id, action: 'FLOOR_DELETED', targetType: 'MapFloor', targetId: floor.id, mapId: map.id })
    const remainingFloors = await transaction.mapFloor.findMany({
      where: { mapId: map.id },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: { id: true },
    })

    await Promise.all(remainingFloors.map((remainingFloor, order) => transaction.mapFloor.update({
      where: { id: remainingFloor.id },
      data: { order },
    })))
  })

  return { ok: true }
})
