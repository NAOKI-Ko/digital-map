import type { PaperMapResponse } from '~~/shared/types/paper-map'
import { loadPaperMapSource, paperMapWarnings, serializePaperMap } from '~~/server/utils/paper-map'

export default defineEventHandler(async (event): Promise<PaperMapResponse> => {
  const { map } = await requireMapAccess(event)
  const paperMapId = getRouterParam(event, 'paperMapId')
  const record = await prisma.paperMap.findFirst({ where: { id: paperMapId, mapId: map.id } })
  if (!record) throw createError({ statusCode: 404, statusMessage: '紙マップが見つかりません。' })
  const paperMap = serializePaperMap(record)
  const source = await loadPaperMapSource(map.id, paperMap.config.sourceMode, event)
  return { paperMap, source, warnings: paperMapWarnings(source, paperMap.config) }
})
