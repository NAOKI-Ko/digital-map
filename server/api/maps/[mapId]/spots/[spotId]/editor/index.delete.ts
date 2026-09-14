export default defineEventHandler(async (event) => {
  const { spot, map, session } = await requireOwnedSpot(event)
  await prisma.$transaction(async (tx) => {
    const previous = await tx.spotEditorAssignment.findUnique({ where: { spotId: spot.id } })
    await tx.spotEditorAssignment.deleteMany({ where: { spotId: spot.id } })
    if (previous) await appendAuditEvent(tx, { tenantId: map.tenantId, actorUserId: session.user.id, action: 'SPOT_EDITOR_REMOVED', targetType: 'SpotEditorAssignment', targetId: spot.id, mapId: map.id, metadata: { oldAssigneeId: previous.userId } })
  })
  return { removed: true }
})
