import { spotEditorAssignmentSchema } from '~~/shared/schemas/spot-revision'

export default defineEventHandler(async (event) => {
  const { map, spot, session } = await requireOwnedSpot(event)
  const input = await readValidatedBody(event, spotEditorAssignmentSchema.parse)
  const member = await prisma.tenantMember.findUnique({ where: { tenantId_userId: { tenantId: map.tenantId, userId: input.userId } } })
  if (!member) throw createError({ statusCode: 422, statusMessage: '同じ組織のMEMBERだけをSpot担当者に設定できます。' })
  const assignment = await prisma.$transaction(async (tx) => {
    const previous = await tx.spotEditorAssignment.findUnique({ where: { spotId: spot.id } })
    const updated = await tx.spotEditorAssignment.upsert({ where: { spotId: spot.id }, create: { spotId: spot.id, userId: input.userId, assignedById: session.user.id }, update: { userId: input.userId, assignedById: session.user.id } })
    await appendAuditEvent(tx, { tenantId: map.tenantId, actorUserId: session.user.id, action: previous ? 'SPOT_EDITOR_REPLACED' : 'SPOT_EDITOR_ASSIGNED', targetType: 'SpotEditorAssignment', targetId: spot.id, mapId: map.id, metadata: { oldAssigneeId: previous?.userId ?? null, newAssigneeId: input.userId } })
    return updated
  })
  return { assignment }
})
