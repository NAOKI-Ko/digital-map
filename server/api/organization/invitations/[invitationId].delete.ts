export default defineEventHandler(async (event) => {
  const { tenant, session } = await requireTenantOwner(event)
  const invitationId = getRouterParam(event, 'invitationId')
  if (!invitationId) throw createError({ statusCode: 400, statusMessage: '招待IDが必要です。' })
  const updated = await prisma.$transaction(async (tx) => {
    const invitation = await tx.organizationInvitation.findFirst({ where: { id: invitationId, tenantId: tenant.id, status: 'PENDING' }, select: { purpose: true, targetSpotId: true } })
    const result = await tx.organizationInvitation.updateMany({ where: { id: invitationId, tenantId: tenant.id, status: 'PENDING' }, data: { status: 'REVOKED', revokedAt: new Date() } })
    if (result.count === 1) await appendAuditEvent(tx, { tenantId: tenant.id, actorUserId: session.user.id, action: invitation?.purpose === 'SPOT_EDITOR' ? 'SPOT_INVITE_REVOKED' : 'ORG_INVITE_REVOKED', targetType: 'OrganizationInvitation', targetId: invitationId, metadata: { spotId: invitation?.targetSpotId ?? null } })
    return result
  })
  if (updated.count !== 1) throw createError({ statusCode: 404, statusMessage: '有効な招待が見つかりません。' })
  return { revoked: true }
})
