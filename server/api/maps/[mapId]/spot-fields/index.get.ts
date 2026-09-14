import type { SpotFieldDefinitionListResponse } from '~~/shared/types/spot-field'

export default defineEventHandler(async (event): Promise<SpotFieldDefinitionListResponse> => {
  const { map } = await requireOwnedMap(event)
  const fields = await prisma.spotFieldDefinition.findMany({
    where: { mapId: map.id },
    include: { _count: { select: { values: true } }, translations: { where: { locale: 'en' }, select: { label: true } } },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })
  return { fields: fields.map(field => ({ ...toSpotFieldDefinition(field), englishLabel: field.translations[0]?.label ?? null })) }
})
