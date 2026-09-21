import type { PaperMapListResponse } from '~~/shared/types/paper-map'
import { loadPaperMapSource, serializePaperMapSummary } from '~~/server/utils/paper-map'

export default defineEventHandler(async (event): Promise<PaperMapListResponse> => {
  const { map } = await requireMapAccess(event)
  const [records, source] = await Promise.all([
    prisma.paperMap.findMany({ where: { mapId: map.id }, orderBy: { updatedAt: 'desc' } }),
    loadPaperMapSource(map.id, 'LIVE', event),
  ])
  return { paperMaps: records.map(serializePaperMapSummary), source }
})
