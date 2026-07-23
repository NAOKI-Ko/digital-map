import type { Prisma } from '../../prisma/generated/client'
import type { PublicMap } from '../../shared/types/public-map'
import { prisma } from './prisma'

export function buildPublicMapQuery(slug: string) {
  return {
    where: {
      slug,
      isPublished: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      isPublished: true,
      floors: {
        orderBy: [{ order: 'asc' as const }, { createdAt: 'asc' as const }],
        select: {
          id: true,
          name: true,
          illustrationUrl: true,
          imageWidth: true,
          imageHeight: true,
          order: true,
          refAPixelX: true,
          refAPixelY: true,
          refALat: true,
          refALng: true,
          refBPixelX: true,
          refBPixelY: true,
          refBLat: true,
          refBLng: true,
          spots: {
            where: {
              isPublished: true,
              lat: { not: null },
              lng: { not: null },
            },
            orderBy: [{ name: 'asc' as const }, { createdAt: 'asc' as const }],
            select: {
              id: true,
              floorId: true,
              name: true,
              category: true,
              description: true,
              lat: true,
              lng: true,
              photosJson: true,
              hoursText: true,
              holidayText: true,
              phone: true,
              pinIconType: true,
              pinIconId: true,
              pinIconImageUrl: true,
              pinColor: true,
              isPublished: true,
            },
          },
        },
      },
    },
  } satisfies Prisma.MapFindFirstArgs
}

export type PublicMapRecord = Prisma.MapGetPayload<{
  select: ReturnType<typeof buildPublicMapQuery>['select']
}>

export function serializePublicMap(record: PublicMapRecord | null): PublicMap | null {
  if (!record?.isPublished) return null

  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    floors: record.floors.map(floor => ({
      id: floor.id,
      name: floor.name,
      illustrationUrl: floor.illustrationUrl,
      imageWidth: floor.imageWidth,
      imageHeight: floor.imageHeight,
      order: floor.order,
      refAPixelX: floor.refAPixelX,
      refAPixelY: floor.refAPixelY,
      refALat: floor.refALat,
      refALng: floor.refALng,
      refBPixelX: floor.refBPixelX,
      refBPixelY: floor.refBPixelY,
      refBLat: floor.refBLat,
      refBLng: floor.refBLng,
      spots: floor.spots.flatMap((spot) => {
        if (!spot.isPublished || spot.lat === null || spot.lng === null) return []
        const photos = Array.isArray(spot.photosJson)
          ? spot.photosJson.filter((value): value is string => typeof value === 'string')
          : []

        return [{
          id: spot.id,
          floorId: spot.floorId,
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
        }]
      }),
    })),
  }
}

export async function getPublicMapBySlug(slug: string) {
  const record = await prisma.map.findFirst(buildPublicMapQuery(slug))
  return serializePublicMap(record)
}
