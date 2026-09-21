import { Prisma } from '~~/prisma/generated/client'
import type { PaperMapResponse } from '~~/shared/types/paper-map'
import { appendAuditEvent } from '~~/server/utils/audit'
import { loadPaperMapSource, paperMapWarnings, serializePaperMap } from '~~/server/utils/paper-map'

export default defineEventHandler(async (event): Promise<PaperMapResponse> => {
  const { map, session } = await requireMapAccess(event)
  const paperMapId = getRouterParam(event, 'paperMapId')
  const sourceRecord = await prisma.paperMap.findFirst({ where: { id: paperMapId, mapId: map.id } })
  if (!sourceRecord) throw createError({ statusCode: 404, statusMessage: '紙マップが見つかりません。' })
  const copy = await prisma.paperMap.create({ data: { mapId: map.id, createdById: session.user.id, name: `${sourceRecord.name}（複製）`, configVersion: sourceRecord.configVersion, config: sourceRecord.config as Prisma.InputJsonValue } })
  const paperMap = serializePaperMap(copy)
  const source = await loadPaperMapSource(map.id, paperMap.config.sourceMode, event)
  await appendAuditEvent(prisma, { tenantId: map.tenantId, actorUserId: session.user.id, action: 'PAPER_MAP_DUPLICATED', targetType: 'PaperMap', targetId: copy.id, mapId: map.id, metadata: { sourcePaperMapId: sourceRecord.id } })
  setResponseStatus(event, 201)
  return { paperMap, source, warnings: paperMapWarnings(source, paperMap.config) }
})
