import type { SpotFieldDefinitionListResponse } from '~~/shared/types/spot-field'
import { isMapLocale, orderedMapLocales } from '~~/shared/constants/map-languages'

export default defineEventHandler(async (event): Promise<SpotFieldDefinitionListResponse> => {
  const { map } = await requireOwnedMap(event)
  const [config, fields] = await Promise.all([
    prisma.map.findUniqueOrThrow({ where: { id: map.id }, select: { defaultLocale: true, enabledLocales: true } }),
    prisma.spotFieldDefinition.findMany({
      where: { mapId: map.id },
      include: { _count: { select: { values: true } }, translations: { select: { locale: true, label: true } } },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    }),
  ])
  const defaultLocale = isMapLocale(config.defaultLocale) ? config.defaultLocale : 'ja'
  return {
    defaultLocale,
    enabledLocales: orderedMapLocales(defaultLocale, config.enabledLocales),
    fields: fields.map(toSpotFieldDefinition),
  }
})
