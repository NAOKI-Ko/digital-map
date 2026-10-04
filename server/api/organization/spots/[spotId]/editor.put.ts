import { z } from 'zod'
import { requireWorkspaceSpot } from '~~/server/utils/workspace-spot'
export default defineEventHandler(async event => {
  const { session, spot } = await requireWorkspaceSpot(event)
  const { userId } = await readValidatedBody(event, z.object({ userId: z.string().min(1).nullable() }).strict().parse)
  return prisma.$transaction(async tx => {
    if (userId && !await tx.tenantMember.findUnique({ where: { tenantId_userId: { tenantId: spot.tenantId, userId } } })) throw createError({ statusCode: 422, statusMessage: '同じワークスペースのメンバーを指定してください。' })
    if (userId) await tx.spotEditorAssignment.upsert({ where: { spotId: spot.id }, create: { spotId: spot.id, userId, assignedById: session.user.id }, update: { userId, assignedById: session.user.id } })
    else await tx.spotEditorAssignment.deleteMany({ where: { spotId: spot.id } })
    await appendAuditEvent(tx, { tenantId: spot.tenantId, actorUserId: session.user.id, action: userId ? 'SPOT_EDITOR_ASSIGNED' : 'SPOT_EDITOR_REMOVED', targetType: 'SpotEditorAssignment', targetId: spot.id, mapId: spot.schemaMapId, metadata: { userId } })
    return { userId }
  }, { isolationLevel: 'Serializable' })
})
