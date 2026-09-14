export default defineEventHandler(async (event) => {
  const { tenant } = await requireTenantOwner(event)
  const now = new Date()
  await prisma.organizationInvitation.updateMany({
    where: { tenantId: tenant.id, status: 'PENDING', expiresAt: { lte: now } },
    data: { status: 'EXPIRED' },
  })
  const invitations = await prisma.organizationInvitation.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, email: true, purpose: true, status: true, expiresAt: true, createdAt: true, acceptedAt: true, revokedAt: true },
    orderBy: { createdAt: 'desc' },
  })
  return { invitations }
})
