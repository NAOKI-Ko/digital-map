import type { AdminMapListResponse } from '~~/shared/types/map'

export default defineEventHandler(async (event): Promise<AdminMapListResponse> => {
  const { session, membership } = await requireTenantMember(event)
  const maps = await prisma.map.findMany({
    where: {
      tenantId: session.user.tenantId,
      ...(membership.role === 'OWNER' ? {} : { members: { some: { userId: session.user.id, role: 'EDITOR' } } }),
    },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      isPublished: true,
      updatedAt: true,
      _count: {
        select: { floors: true },
      },
    },
  })

  return {
    permissions: { canCreateMap: membership.role === 'OWNER' && maps.length === 0, isOwner: membership.role === 'OWNER' },
    maps: maps.map(map => ({
      id: map.id,
      name: map.name,
      slug: map.slug,
      isPublished: map.isPublished,
      floorCount: map._count.floors,
      updatedAt: map.updatedAt.toISOString(),
    })),
  }
})
