import type { MapEditorsResponse } from '~~/shared/types/organization'

export default defineEventHandler(async (event): Promise<MapEditorsResponse> => {
  const access = await requireMapAccess(event)
  await requireTenantOwner(event, access.map.tenantId)
  const [assignments, members] = await Promise.all([
    prisma.mapMember.findMany({ where: { mapId: access.map.id }, include: { user: { select: { email: true, displayName: true } } }, orderBy: { createdAt: 'asc' } }),
    prisma.tenantMember.findMany({ where: { tenantId: access.map.tenantId, role: 'MEMBER' }, include: { user: { select: { email: true, displayName: true } } }, orderBy: { createdAt: 'asc' } }),
  ])
  const assigned = new Set(assignments.map(item => item.userId))
  return {
    editors: assignments.map(item => ({ userId: item.userId, email: item.user.email, displayName: item.user.displayName })),
    candidates: members.filter(item => !assigned.has(item.userId)).map(item => ({ userId: item.userId, email: item.user.email, displayName: item.user.displayName })),
  }
})
