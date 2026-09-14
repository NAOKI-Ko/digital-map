export default defineEventHandler(async (event) => {
  const { tenant } = await requireTenantOwner(event)
  const invitationId = getRouterParam(event, 'invitationId')
  if (!invitationId) throw createError({ statusCode: 400, statusMessage: '招待IDが必要です。' })
  const updated = await prisma.organizationInvitation.updateMany({
    where: { id: invitationId, tenantId: tenant.id, status: 'PENDING' },
    data: { status: 'REVOKED', revokedAt: new Date() },
  })
  if (updated.count !== 1) throw createError({ statusCode: 404, statusMessage: '有効な招待が見つかりません。' })
  return { revoked: true }
})
