import type { SpotCsvPreviewResponse } from '~~/shared/types/spot-csv'
import { loadSpotCsvContext, previewSpotCsv } from '~~/server/utils/spot-csv'

export default defineEventHandler(async (event): Promise<SpotCsvPreviewResponse> => {
  const { map } = await requireOwnedMap(event)
  const body = await readBody<{ csv?: string }>(event)
  if (typeof body.csv !== 'string') throw createError({ statusCode: 422, statusMessage: 'CSVを指定してください。' })
  const context = await loadSpotCsvContext(prisma, map.id)
  return { preview: previewSpotCsv(body.csv, context.fields, context.categories, context.existingNames, context.enabledLocales, context.spots, undefined, context.floors).preview }
})
