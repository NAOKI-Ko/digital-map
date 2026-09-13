import type { Prisma } from '../../prisma/generated/client'
import type { PublicMap } from '../../shared/types/public-map'
import { normalizePinIconType, normalizeSpotImportance } from '../../shared/constants/spot'
import { prisma } from './prisma'
import { categoryOrderBy, sortSpotCategories, spotCategorySelect } from './category'

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
      organizationName: true,
      logoUrl: true,
      websiteUrl: true,
      snsUrl: true,
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
          refAImageX: true,
          refAImageY: true,
          refALat: true,
          refALng: true,
          refBImageX: true,
          refBImageY: true,
          refBLat: true,
          refBLng: true,
          spots: {
            where: {
              isPublished: true,
              x: { not: null },
              y: { not: null },
            },
            orderBy: [{ name: 'asc' as const }, { createdAt: 'asc' as const }],
            select: {
              id: true,
              floorId: true,
              name: true,
              importance: true,
              description: true,
              x: true,
              y: true,
              photosJson: true,
              hoursText: true,
              holidayText: true,
              phone: true,
              pinIconType: true,
              pinIconId: true,
              pinIconImageUrl: true,
              pinColor: true,
              isPublished: true,
              spotCategories: { select: spotCategorySelect },
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
    organizationName: record.organizationName,
    logoUrl: record.logoUrl,
    websiteUrl: record.websiteUrl,
    snsUrl: record.snsUrl,
    floors: record.floors.map(floor => ({
      id: floor.id,
      name: floor.name,
      illustrationUrl: floor.illustrationUrl,
      imageWidth: floor.imageWidth,
      imageHeight: floor.imageHeight,
      order: floor.order,
      refAImageX: floor.refAImageX,
      refAImageY: floor.refAImageY,
      refALat: floor.refALat,
      refALng: floor.refALng,
      refBImageX: floor.refBImageX,
      refBImageY: floor.refBImageY,
      refBLat: floor.refBLat,
      refBLng: floor.refBLng,
      spots: floor.spots.flatMap((spot) => {
        if (!spot.isPublished || spot.x === null || spot.y === null) return []
        const photos = Array.isArray(spot.photosJson)
          ? spot.photosJson.filter((value): value is string => typeof value === 'string')
          : []

        return [{
          id: spot.id,
          floorId: spot.floorId,
          name: spot.name,
          categories: sortSpotCategories(spot.spotCategories.map(relation => relation.category)),
          importance: normalizeSpotImportance(spot.importance),
          description: spot.description,
          x: spot.x,
          y: spot.y,
          photos,
          hoursText: spot.hoursText,
          holidayText: spot.holidayText,
          phone: spot.phone,
          pinIconType: normalizePinIconType(spot.pinIconType),
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
