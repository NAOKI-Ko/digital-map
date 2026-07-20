import type { Prisma } from '~~/prisma/generated/client'

export const adminSpotInclude = {
  floor: { select: { name: true } },
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
    category: spot.category,
    description: spot.description,
    lat: spot.lat,
    lng: spot.lng,
    photos,
    hoursText: spot.hoursText,
    holidayText: spot.holidayText,
    phone: spot.phone,
    pinIconType: spot.pinIconType === 'custom' ? 'custom' as const : 'preset' as const,
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
