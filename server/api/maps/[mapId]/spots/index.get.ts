import type { Prisma } from '~~/prisma/generated/client'
import { normalizePinIconType, normalizeSpotImportance } from '~~/shared/constants/spot'
import { categoryOrderBy, sortSpotCategories, spotCategorySelect } from '~~/server/utils/category'
import type { AdminSpotListResponse } from '~~/shared/types/spot'

export default defineEventHandler(async (event): Promise<AdminSpotListResponse> => {
  const { map } = await requireOwnedMap(event)
  const query = getQuery(event)
  const keyword = typeof query.q === 'string' ? query.q.trim().slice(0, 100) : ''
  const categoryId = typeof query.categoryId === 'string' ? query.categoryId : ''
  const floorId = typeof query.floorId === 'string' ? query.floorId : ''
  const status = query.status === 'published' || query.status === 'draft' ? query.status : ''
  const where: Prisma.SpotWhereInput = {
    floor: { mapId: map.id },
    ...(keyword
      ? {
          OR: [
            { name: { contains: keyword, mode: 'insensitive' } },
            { spotCategories: { some: { category: { name: { contains: keyword, mode: 'insensitive' } } } } },
            { description: { contains: keyword, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(categoryId ? { spotCategories: { some: { categoryId, category: { mapId: map.id } } } } : {}),
    ...(floorId ? { floorId } : {}),
    ...(status ? { isPublished: status === 'published' } : {}),
  }

  const [spots, floors, categories] = await Promise.all([
    prisma.spot.findMany({
      where,
      select: {
        id: true,
        floorId: true,
        name: true,
        importance: true,
        lat: true,
        lng: true,
        isPublished: true,
        pinIconType: true,
        pinIconId: true,
        pinIconImageUrl: true,
        pinColor: true,
        updatedAt: true,
        floor: { select: { name: true } },
        spotCategories: { select: spotCategorySelect },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.mapFloor.findMany({
      where: { mapId: map.id },
      select: { id: true, name: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.category.findMany({
      where: { mapId: map.id },
      select: { id: true, name: true, order: true },
      orderBy: categoryOrderBy,
    }),
  ])

  return {
    spots: spots.map(spot => ({
      id: spot.id,
      floorId: spot.floorId,
      floorName: spot.floor.name,
      name: spot.name,
      categories: sortSpotCategories(spot.spotCategories.map(relation => relation.category)),
      importance: normalizeSpotImportance(spot.importance),
      lat: spot.lat,
      lng: spot.lng,
      isPublished: spot.isPublished,
      pinIconType: normalizePinIconType(spot.pinIconType),
      pinIconId: spot.pinIconId,
      pinIconImageUrl: spot.pinIconImageUrl,
      pinColor: spot.pinColor,
      updatedAt: spot.updatedAt.toISOString(),
    })),
    filters: {
      categories,
      floors,
    },
  }
})
