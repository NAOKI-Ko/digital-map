import type { AdminMapListResponse } from '~~/shared/types/map'

export default defineEventHandler(async (event): Promise<AdminMapListResponse> => {
  const session = await requireAdminSession(event)
  const maps = await prisma.map.findMany({
    where: { tenantId: session.user.tenantId },
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
