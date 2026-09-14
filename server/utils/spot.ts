import type { Prisma } from '~~/prisma/generated/client'
import { normalizePinIconType, normalizePinSize, normalizeSpotImportance } from '~~/shared/constants/spot'
import { sortSpotCategories, spotCategorySelect } from './category'

export const adminSpotInclude = {
  floor: { select: { name: true } },
  spotCategories: { select: spotCategorySelect },
  photos: { include: { asset: true }, orderBy: { order: 'asc' as const } },
  fieldValues: true,
  translations: { where: { locale: 'en' as const } },
  fieldValueTranslations: { where: { locale: 'en' as const } },
} satisfies Prisma.SpotInclude

type SpotWithFloor = Prisma.SpotGetPayload<{ include: typeof adminSpotInclude }>

function isCustomSpotFieldValue(value: Prisma.JsonValue): value is string | number | boolean | null {
  return value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}

export function toAdminSpotDetail(spot: SpotWithFloor) {
  const photos = Array.isArray(spot.photosJson)
    ? spot.photosJson.filter((value): value is string => typeof value === 'string')
    : []
  const assetIdByUrl = new Map(spot.photos.map(photo => [`/uploads/${photo.asset.storageKey}`, photo.assetId]))

  return {
    id: spot.id,
    floorId: spot.floorId,
    floorName: spot.floor.name,
    name: spot.name,
    englishTranslation: spot.translations[0]
      ? {
          name: spot.translations[0].name,
          description: spot.translations[0].description,
          address: spot.translations[0].address,
          hoursText: spot.translations[0].hoursText,
          holidayText: spot.translations[0].holidayText,
          customValues: Object.fromEntries(spot.fieldValueTranslations.map(value => [value.fieldDefinitionId, value.value])),
        }
      : null,
    categories: sortSpotCategories(spot.spotCategories.map(relation => relation.category)),
    importance: normalizeSpotImportance(spot.importance),
    description: spot.description,
    address: spot.address,
    website: spot.website,
    customValues: Object.fromEntries(spot.fieldValues.flatMap(value =>
      isCustomSpotFieldValue(value.valueJson) ? [[value.fieldDefinitionId, value.valueJson]] : [],
    )),
    x: spot.x,
    y: spot.y,
    photos,
    photoAssetIds: photos.map(photo => assetIdByUrl.get(photo) ?? null),
    hoursText: spot.hoursText,
    holidayText: spot.holidayText,
    phone: spot.phone,
    pinIconType: normalizePinIconType(spot.pinIconType),
    pinIconId: spot.pinIconId,
    pinIconImageUrl: spot.pinIconImageUrl,
    pinIconAssetId: spot.pinIconAssetId,
    pinColor: spot.pinColor,
    pinSize: normalizePinSize(spot.pinSize),
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
    select: { id: true, name: true, order: true, iconType: true, iconPresetId: true, iconImageUrl: true, iconAssetId: true },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  })
}

export async function getMapSpotFieldDefinitions(mapId: string) {
  const fields = await prisma.spotFieldDefinition.findMany({
    where: { mapId },
    include: { _count: { select: { values: true } } },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })
  return fields.map(toSpotFieldDefinition)
}
