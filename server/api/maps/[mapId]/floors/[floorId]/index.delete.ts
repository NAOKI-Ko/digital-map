import { refreshPrimaryProjection, reconcileUsagePublication } from '~~/server/utils/illustration-placement'
export default defineEventHandler(async (event) => {
  const { map, floor, session } = await requireOwnedFloor(event)

  await prisma.$transaction(async (transaction) => {
    const affected = await transaction.illustrationPlacement.findMany({ where: { floorId: floor.id }, select: { usageId: true } })
    await transaction.mapFloor.delete({ where: { id: floor.id } })
    for (const usageId of new Set(affected.map(item => item.usageId))) { await refreshPrimaryProjection(transaction, usageId); await reconcileUsagePublication(transaction, usageId) }
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
