import type { Prisma } from '../../prisma/generated/client'
import type { PublicMap } from '../../shared/types/public-map'
import { normalizePinIconType, normalizePinSize, normalizeSpotImportance } from '../../shared/constants/spot'
import { prisma } from './prisma'
import { categoryOrderBy, sortSpotCategories, spotCategorySelect } from './category'
import { normalizeLocale, translatedValue, type AppLocale } from '../../shared/i18n/messages'

export function buildPublicMapQuery(slug: string) {
  return {
    where: {
      slug,
      isPublished: true,
    },
    select: {
      id: true,
      name: true,
      defaultLocale: true,
      enabledLocales: true,
      translations: { select: { locale: true, name: true, description: true } },
      slug: true,
      organizationName: true,
      logoUrl: true,
      websiteUrl: true,
      snsUrl: true,
      isPublished: true,
      spotFieldDefinitions: {
        where: { enabled: true, publicVisible: true },
        orderBy: [{ order: 'asc' as const }, { createdAt: 'asc' as const }],
        select: { id: true, semanticKey: true, label: true, type: true, order: true, translations: { select: { locale: true, label: true } } },
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
              translations: { select: { locale: true, name: true, description: true, address: true, hoursText: true, holidayText: true } },
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
              fieldValueTranslations: { select: { fieldDefinitionId: true, locale: true, value: true } },
              pinIconType: true,
              pinIconId: true,
              pinIconImageUrl: true,
              pinColor: true,
              pinSize: true,
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

export function serializePublicMap(record: PublicMapRecord | null, requestedLocale: unknown = 'ja'): PublicMap | null {
  if (!record?.isPublished) return null

  const publicFields = record.spotFieldDefinitions
  const enabledLocales = record.enabledLocales?.length ? record.enabledLocales : ['ja']
  const locale = normalizeLocale(requestedLocale, enabledLocales)

  return {
    id: record.id,
    name: translatedValue(record.name, record.translations ?? [], locale, 'name') ?? record.name,
    slug: record.slug,
    locale,
    defaultLocale: 'ja',
    enabledLocales: enabledLocales.filter((value): value is AppLocale => value === 'ja' || value === 'en'),
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
        const localizedCustomValues = new Map((spot.fieldValueTranslations ?? []).filter(value => value.locale === locale).map(value => [value.fieldDefinitionId, value.value]))
        const spotTranslations = spot.translations ?? []
        const spotName = translatedValue(spot.name, spotTranslations, locale, 'name') ?? spot.name
        const spotDescription = translatedValue(spot.description, spotTranslations, locale, 'description')
        const standardValues: Record<string, unknown> = {
          description: spotDescription,
          address: translatedValue(spot.address, spotTranslations, locale, 'address'),
          phone: spot.phone,
          website: spot.website,
          hours: translatedValue(spot.hoursText, spotTranslations, locale, 'hoursText'),
          holiday: translatedValue(spot.holidayText, spotTranslations, locale, 'holidayText'),
        }
        const descriptionField = publicFields.find(field => field.semanticKey === 'description')
        const websiteField = publicFields.find(field => field.semanticKey === 'website')
        const visibleDescription = descriptionField && typeof spotDescription === 'string' && spotDescription.trim()
          ? spotDescription
          : null
        const websiteAction = websiteField && typeof spot.website === 'string' && spot.website.trim()
          ? { label: websiteField.label, url: spot.website }
          : null
        const informationFields = publicFields.flatMap((field) => {
          if (field.semanticKey === 'description' || field.semanticKey === 'website') return []
          const value = field.semanticKey ? standardValues[field.semanticKey] : (['single_line_text', 'multiline_text'].includes(field.type) ? localizedCustomValues.get(field.id) ?? customValues.get(field.id) : customValues.get(field.id))
          if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return []
          if (!['string', 'number', 'boolean'].includes(typeof value)) return []
          const renderedValue = typeof value === 'boolean' ? (value ? 'はい' : 'いいえ') : String(value)
          const href = field.semanticKey === 'phone'
            ? `tel:${renderedValue}`
            : field.type === 'url' && /^https?:\/\//i.test(renderedValue) ? renderedValue : null
          return [{
            id: field.id,
            label: translatedValue(field.label, field.translations ?? [], locale, 'label') ?? field.label,
            type: field.type as PublicMap['floors'][number]['spots'][number]['informationFields'][number]['type'],
            value: renderedValue,
            href,
          }]
        })

        return [{
          id: spot.id,
          floorId: spot.floorId,
          name: spotName,
          categories: sortSpotCategories(spot.spotCategories.map((relation) => {
            const category = relation.category
            return { ...category, name: translatedValue(category.name, category.translations ?? [], locale, 'name') ?? category.name }
          })),
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
          pinSize: normalizePinSize(spot.pinSize),
        }]
      }),
      decorations: floor.decorations.map(item => ({ id: item.id, imageUrl: `/uploads/${item.asset.storageKey}`, imageWidth: item.asset.width, imageHeight: item.asset.height, x: item.x, y: item.y, width: item.width, rotation: item.rotation, order: item.order })),
    })),
  }
}

export async function getPublicMapBySlug(slug: string, locale: unknown = 'ja') {
  const record = await prisma.map.findFirst(buildPublicMapQuery(slug))
  return serializePublicMap(record, locale)
}
