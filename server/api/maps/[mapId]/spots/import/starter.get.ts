import { createSpotCsvStarter, loadSpotCsvContext } from '~~/server/utils/spot-csv'

export default defineEventHandler(async (event) => {
  const { map } = await requireOwnedMap(event)
  const context = await loadSpotCsvContext(prisma, map.id)
  setHeader(event, 'content-type', 'text/csv; charset=utf-8')
  setHeader(event, 'content-disposition', 'attachment; filename="spot-new-rows.csv"')
  return createSpotCsvStarter(context)
})
