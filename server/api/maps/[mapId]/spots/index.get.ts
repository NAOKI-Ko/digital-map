import { resolveEffectivePinAppearance } from '~~/shared/utils/pin-appearance'
import { pinSourceInclude } from '~~/server/utils/pin-appearance'
import { spotPhotoCount } from '~~/shared/utils/spot-operations'
import type { Prisma } from '~~/prisma/generated/client'
import { normalizePinIconType, normalizePinSize, normalizeSpotImportance } from '~~/shared/constants/spot'
import { categoryOrderBy, sortSpotCategories, spotCategorySelect } from '~~/server/utils/category'
import type { AdminSpotListResponse } from '~~/shared/types/spot'

export default defineEventHandler(async (event): Promise<AdminSpotListResponse> => {
  const { map } = await requireOwnedMap(event)
  const query = getQuery(event)
  const keyword = typeof query.q === 'string' ? query.q.trim().slice(0, 100) : ''
  const categoryId = typeof query.categoryId === 'string' ? query.categoryId : ''
  const floorId = typeof query.floorId === 'string' ? query.floorId : ''
  const status = query.status === 'published' || query.status === 'draft' ? query.status : ''
  const position = query.position === 'positioned' || query.position === 'unpositioned' ? query.position : ''
  const sort = query.sort === 'name' || query.sort === 'created' ? query.sort : 'updated'
  const positioned: Prisma.IllustrationPlacementWhereInput = { ...(floorId ? { floorId } : {}), x: { not: null }, y: { not: null } }
  const occurrenceFilter: Prisma.IllustrationPlacementWhereInput = { ...(floorId ? { floorId } : {}), ...(position === 'positioned' ? { x: { not: null }, y: { not: null } } : position === 'unpositioned' ? { x: null, y: null } : {}) }
  const where: Prisma.SpotWhereInput = {
    mapUsage: { mapId: map.id, ...(query.view === 'placements' ? { placements: { some: occurrenceFilter } } : position === 'unpositioned' ? { placements: { none: positioned, ...(floorId ? { some: { floorId } } : {}) } } : (floorId || position) ? { placements: { some: occurrenceFilter } } : {}) },
    ...(['standard', 'category', 'individual'].includes(String(query.pinSource)) ? { pinSourceMode: String(query.pinSource) } : {}),
    ...(typeof query.pinSourceCategoryId === 'string' && query.pinSourceCategoryId ? { pinSourceCategoryId: query.pinSourceCategoryId } : {}),
    ...(keyword
      ? {
          AND: [{ OR: [
            { name: { contains: keyword, mode: 'insensitive' } },
            { spotCategories: { some: { category: { name: { contains: keyword, mode: 'insensitive' } } } } },
            { description: { contains: keyword, mode: 'insensitive' } },
          ] }],
        }
      : {}),
    ...(categoryId === 'none' ? { spotCategories: { none: {} } } : categoryId ? { spotCategories: { some: { categoryId, category: { mapId: map.id } } } } : {}),
    ...(status ? { isPublished: status === 'published' } : {}),
  }

  const [spots, floors, categories, unplaced, positionedTargetOff] = await Promise.all([
    prisma.spot.findMany({
      where,
      select: {
        id: true,
        mapUsage: { include: { placements: { include: { floor: { select: { name: true } } } } } },
        floorId: true,
        name: true,
        address: true,
        importance: true,
        x: true,
        y: true,
        lat: true,
        lng: true,
        isPublished: true,
        pinSourceMode: true,
        pinSourceCategoryId: true,
        pinSourceCategory: pinSourceInclude,
        pinIconType: true,
        pinIconId: true,
        pinIconImageUrl: true,
        pinIconAssetId: true,
        pinColor: true,
        pinSize: true,
        updatedAt: true,
        liveVersion: true,
        photosJson: true,
        _count: { select: { photos: true } },
        floor: { select: { name: true } },
        spotCategories: { select: spotCategorySelect },
      },
      orderBy: sort === 'name' ? [{ name: 'asc' }, { createdAt: 'desc' }] : sort === 'created' ? { createdAt: 'desc' } : { updatedAt: 'desc' },
    }),
    prisma.mapFloor.findMany({
      where: { mapId: map.id },
      select: { id: true, name: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.category.findMany({
      where: { mapId: map.id },
      select: { id: true, name: true, order: true, iconType: true, iconPresetId: true, iconImageUrl: true, iconAssetId: true },
      orderBy: categoryOrderBy,
    }),
    prisma.spot.count({ where: { mapUsage: { mapId: map.id, placements: { none: { x: { not: null }, y: { not: null } } } } } }),
    prisma.spot.count({ where: { mapUsage: { mapId: map.id, placements: { some: { x: { not: null }, y: { not: null } } } }, isPublished: false } }),
  ])

  return {
    taskCounts: { unplaced, positionedTargetOff },
    spots: spots.map(spot => ({
      id: spot.id,
      floorId: spot.floorId ?? '',
      floorName: spot.floor?.name ?? 'フロア未設定',
      name: spot.name,
      address: spot.address,
      categories: sortSpotCategories(spot.spotCategories.map(relation => relation.category)),
      importance: normalizeSpotImportance(spot.importance),
      x: spot.x,
      y: spot.y,
      lat: spot.lat,
      lng: spot.lng,
      isPublished: spot.isPublished,
      hasPositionedPlacement: spot.mapUsage?.placements.some(item => item.x !== null && item.y !== null),
      positionedPlacementId: spot.mapUsage?.placements.find(item => item.x !== null && item.y !== null && (!floorId || item.floorId === floorId))?.id,
      positionedFloorId: spot.mapUsage?.placements.find(item => item.x !== null && item.y !== null && (!floorId || item.floorId === floorId))?.floorId,
      positionedFloorName: spot.mapUsage?.placements.find(item => item.x !== null && item.y !== null && (!floorId || item.floorId === floorId))?.floor.name,






      ...resolveEffectivePinAppearance(spot),
      pinSourceMode: spot.pinSourceMode,
      pinSourceCategoryId: spot.pinSourceCategoryId,
      pinSourceCategoryName: spot.pinSourceCategory?.name ?? null,
    pinSourceCategoryHasDefault: Boolean(spot.pinSourceCategory?.pinDefaultType),
      updatedAt: spot.updatedAt.toISOString(),
      liveVersion: spot.liveVersion,
      photoCount: spotPhotoCount(spot.photosJson, spot._count.photos),
    })).flatMap((spot, index) => query.view !== 'placements' ? [spot] : (spots[index]!.mapUsage?.placements ?? []).filter(item => (!floorId || item.floorId === floorId) && (!position || (position === 'positioned' ? item.x !== null && item.y !== null : item.x === null && item.y === null))).map(placement => ({ ...spot, id: placement.id, canonicalSpotId: spot.id, placementId: placement.id, placementVersion: placement.version, floorId: placement.floorId, floorName: placement.floor.name, x: placement.x, y: placement.y }))).filter(spot => query.photo !== 'none' || spot.photoCount === 0),
    filters: {
      categories,
      floors,
    },
  }
})
