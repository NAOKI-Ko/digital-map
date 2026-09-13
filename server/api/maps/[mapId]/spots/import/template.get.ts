import { createSpotCsvTemplate } from '~~/server/utils/spot-csv'

export default defineEventHandler(async (event) => {
  const { map } = await requireOwnedMap(event)
  const fields = await prisma.spotFieldDefinition.findMany({ where: { mapId: map.id }, orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] })
  setHeader(event, 'content-type', 'text/csv; charset=utf-8')
  setHeader(event, 'content-disposition', 'attachment; filename="spot-import-template.csv"')
  return createSpotCsvTemplate(fields)
})
