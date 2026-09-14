import { createSpotCsvExport, loadSpotCsvContext } from '~~/server/utils/spot-csv'

export default defineEventHandler(async (event) => {
  const { map } = await requireOwnedMap(event)
  const floorId = getQuery(event).floorId
  if (typeof floorId !== 'string' || !floorId) throw createError({ statusCode: 422, statusMessage: 'フロアを指定してください。' })
  const context = await loadSpotCsvContext(prisma, map.id, floorId)
  setHeader(event, 'content-type', 'text/csv; charset=utf-8')
  setHeader(event, 'content-disposition', 'attachment; filename="spots-export.csv"')
  setHeader(event, 'cache-control', 'no-store')
  return createSpotCsvExport(context)
})
