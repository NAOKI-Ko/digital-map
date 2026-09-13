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
      spotFieldDefinitions: {
        where: { enabled: true, publicVisible: true },
        orderBy: [{ order: 'asc' as const }, { createdAt: 'asc' as const }],
        select: { id: true, semanticKey: true, label: true, type: true, order: true },
      },
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
              address: true,
              website: true,
              x: true,
              y: true,
              photosJson: true,
              hoursText: true,
              holidayText: true,
              phone: true,
              fieldValues: { select: { fieldDefinitionId: true, valueJson: true } },
              pinIconType: true,
              pinIconId: true,
              pinIconImageUrl: true,
              pinColor: true,
              isPublished: true,
              spotCategories: { select: spotCategorySelect },
            },
          },
          decorations: {
            orderBy: [{ order: 'asc' as const }, { createdAt: 'asc' as const }],
            select: { id: true, x: true, y: true, width: true, rotation: true, order: true, asset: { select: { storageKey: true, width: true, height: true } } },
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

  const publicFields = record.spotFieldDefinitions

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
        const customValues = new Map(spot.fieldValues.map(value => [value.fieldDefinitionId, value.valueJson]))
        const standardValues: Record<string, unknown> = {
          description: spot.description,
          address: spot.address,
          phone: spot.phone,
          website: spot.website,
          hours: spot.hoursText,
          holiday: spot.holidayText,
        }
        const descriptionField = publicFields.find(field => field.semanticKey === 'description')
        const websiteField = publicFields.find(field => field.semanticKey === 'website')
        const visibleDescription = descriptionField && typeof spot.description === 'string' && spot.description.trim()
          ? spot.description
          : null
        const websiteAction = websiteField && typeof spot.website === 'string' && spot.website.trim()
          ? { label: websiteField.label, url: spot.website }
          : null
        const informationFields = publicFields.flatMap((field) => {
          if (field.semanticKey === 'description' || field.semanticKey === 'website') return []
          const value = field.semanticKey ? standardValues[field.semanticKey] : customValues.get(field.id)
          if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return []
          if (!['string', 'number', 'boolean'].includes(typeof value)) return []
          const renderedValue = typeof value === 'boolean' ? (value ? 'はい' : 'いいえ') : String(value)
          const href = field.semanticKey === 'phone'
            ? `tel:${renderedValue}`
            : field.type === 'url' && /^https?:\/\//i.test(renderedValue) ? renderedValue : null
          return [{
            id: field.id,
            label: field.label,
            type: field.type as PublicMap['floors'][number]['spots'][number]['informationFields'][number]['type'],
            value: renderedValue,
            href,
          }]
        })

        return [{
          id: spot.id,
          floorId: spot.floorId,
          name: spot.name,
          categories: sortSpotCategories(spot.spotCategories.map(relation => relation.category)),
          importance: normalizeSpotImportance(spot.importance),
          description: visibleDescription,
          x: spot.x,
          y: spot.y,
          photos,
          informationFields,
          websiteAction,
          pinIconType: normalizePinIconType(spot.pinIconType),
          pinIconId: spot.pinIconId,
          pinIconImageUrl: spot.pinIconImageUrl,
          pinColor: spot.pinColor,
        }]
      }),
      decorations: floor.decorations.map(item => ({ id: item.id, imageUrl: `/uploads/${item.asset.storageKey}`, imageWidth: item.asset.width, imageHeight: item.asset.height, x: item.x, y: item.y, width: item.width, rotation: item.rotation, order: item.order })),
    })),
  }
}

export async function getPublicMapBySlug(slug: string) {
  const record = await prisma.map.findFirst(buildPublicMapQuery(slug))
  return serializePublicMap(record)
}
