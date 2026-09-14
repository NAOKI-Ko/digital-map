import type { SpotCsvPreviewResponse } from '~~/shared/types/spot-csv'
import { loadSpotCsvContext, previewSpotCsv } from '~~/server/utils/spot-csv'

export default defineEventHandler(async (event): Promise<SpotCsvPreviewResponse> => {
  const { map } = await requireOwnedMap(event)
  const body = await readBody<{ floorId?: string, csv?: string }>(event)
  if (!body.floorId || typeof body.csv !== 'string') throw createError({ statusCode: 422, statusMessage: 'フロアとCSVを指定してください。' })
  const context = await loadSpotCsvContext(prisma, map.id, body.floorId)
  return { preview: previewSpotCsv(body.csv, context.fields, context.categories, context.existingNames, context.enabledLocales, context.spots, context.floor.id).preview }
})
