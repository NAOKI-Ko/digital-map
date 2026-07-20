import type { Prisma } from '~~/prisma/generated/client'
import type { AdminSpotListResponse } from '~~/shared/types/spot'

export default defineEventHandler(async (event): Promise<AdminSpotListResponse> => {
  const { map } = await requireOwnedMap(event)
  const query = getQuery(event)
  const keyword = typeof query.q === 'string' ? query.q.trim().slice(0, 100) : ''
  const category = typeof query.category === 'string' ? query.category.trim().slice(0, 100) : ''
  const floorId = typeof query.floorId === 'string' ? query.floorId : ''
  const status = query.status === 'published' || query.status === 'draft' ? query.status : ''
  const where: Prisma.SpotWhereInput = {
    floor: { mapId: map.id },
    ...(keyword
      ? {
          OR: [
            { name: { contains: keyword, mode: 'insensitive' } },
            { category: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(category ? { category } : {}),
    ...(floorId ? { floorId } : {}),
    ...(status ? { isPublished: status === 'published' } : {}),
  }

  const [spots, floors, categoryRows] = await Promise.all([
    prisma.spot.findMany({
      where,
      select: {
        id: true,
        floorId: true,
        name: true,
        category: true,
        lat: true,
        lng: true,
        isPublished: true,
        pinIconType: true,
        pinIconId: true,
        pinIconImageUrl: true,
        pinColor: true,
        updatedAt: true,
        floor: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.mapFloor.findMany({
      where: { mapId: map.id },
      select: { id: true, name: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.spot.findMany({
      where: { floor: { mapId: map.id } },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    }),
  ])

  return {
    spots: spots.map(spot => ({
      id: spot.id,
      floorId: spot.floorId,
      floorName: spot.floor.name,
      name: spot.name,
      category: spot.category,
      lat: spot.lat,
      lng: spot.lng,
      isPublished: spot.isPublished,
      pinIconType: spot.pinIconType === 'custom' ? 'custom' : 'preset',
      pinIconId: spot.pinIconId,
      pinIconImageUrl: spot.pinIconImageUrl,
      pinColor: spot.pinColor,
      updatedAt: spot.updatedAt.toISOString(),
    })),
    filters: {
      categories: categoryRows.map(row => row.category),
      floors,
    },
  }
})
