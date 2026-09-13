import type { OrganizationMembersResponse } from '~~/shared/types/organization'

export default defineEventHandler(async (event): Promise<OrganizationMembersResponse> => {
  const { tenant } = await requireTenantOwner(event)
  const members = await prisma.tenantMember.findMany({
    where: { tenantId: tenant.id },
    include: { user: { select: {
      email: true,
      displayName: true,
      mapMembers: { where: { map: { tenantId: tenant.id } }, select: { map: { select: { id: true, name: true } } } },
    } } },
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
  })
  return { members: members.map(item => ({
    userId: item.userId, email: item.user.email, displayName: item.user.displayName, role: item.role,
    assignedMaps: item.user.mapMembers.map(assignment => assignment.map),
  })) }
})
