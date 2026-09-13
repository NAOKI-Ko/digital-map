import type { OrganizationSummary } from '~~/shared/types/organization'

export default defineEventHandler(async (event): Promise<{ activeOrganizationId: string, organizations: OrganizationSummary[] }> => {
  const session = await requireUser(event)
  const memberships = await prisma.tenantMember.findMany({
    where: { userId: session.user.id },
    include: { tenant: true },
    orderBy: [{ createdAt: 'asc' }, { tenantId: 'asc' }],
  })
  return {
    activeOrganizationId: session.user.tenantId,
    organizations: memberships.map(item => ({ id: item.tenantId, name: item.tenant.name, role: item.role })),
  }
})

