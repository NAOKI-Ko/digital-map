import type { Prisma } from '~~/prisma/generated/client'
import { normalizePinIconType, normalizeSpotImportance } from '~~/shared/constants/spot'
import { sortSpotCategories, spotCategorySelect } from './category'

export const adminSpotInclude = {
  floor: { select: { name: true } },
  spotCategories: { select: spotCategorySelect },
} satisfies Prisma.SpotInclude

type SpotWithFloor = Prisma.SpotGetPayload<{ include: typeof adminSpotInclude }>

export function toAdminSpotDetail(spot: SpotWithFloor) {
  const photos = Array.isArray(spot.photosJson)
    ? spot.photosJson.filter((value): value is string => typeof value === 'string')
    : []

  return {
    id: spot.id,
    floorId: spot.floorId,
    floorName: spot.floor.name,
    name: spot.name,
    categories: sortSpotCategories(spot.spotCategories.map(relation => relation.category)),
    importance: normalizeSpotImportance(spot.importance),
    description: spot.description,
    lat: spot.lat,
    lng: spot.lng,
    photos,
    hoursText: spot.hoursText,
    holidayText: spot.holidayText,
    phone: spot.phone,
    pinIconType: normalizePinIconType(spot.pinIconType),
    pinIconId: spot.pinIconId,
    pinIconImageUrl: spot.pinIconImageUrl,
    pinColor: spot.pinColor,
    isPublished: spot.isPublished,
    createdAt: spot.createdAt.toISOString(),
    updatedAt: spot.updatedAt.toISOString(),
  }
}

export async function getMapFloorOptions(mapId: string) {
  return prisma.mapFloor.findMany({
    where: { mapId },
    select: { id: true, name: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })
}

export async function getMapCategoryOptions(mapId: string) {
  return prisma.category.findMany({
    where: { mapId },
    select: { id: true, name: true, order: true, iconType: true, iconPresetId: true, iconImageUrl: true },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  })
}
