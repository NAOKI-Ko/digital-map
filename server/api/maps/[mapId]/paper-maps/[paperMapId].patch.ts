import { Prisma } from '~~/prisma/generated/client'
import { paperMapUpdateSchema } from '~~/shared/schemas/paper-map'
import type { PaperMapResponse } from '~~/shared/types/paper-map'
import { appendAuditEvent } from '~~/server/utils/audit'
import { loadPaperMapSource, paperMapWarnings, serializePaperMap } from '~~/server/utils/paper-map'

export default defineEventHandler(async (event): Promise<PaperMapResponse> => {
  const { map, session } = await requireMapAccess(event)
  const paperMapId = getRouterParam(event, 'paperMapId')
  const existing = await prisma.paperMap.findFirst({ where: { id: paperMapId, mapId: map.id }, select: { id: true } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: '紙マップが見つかりません。' })
  const parsed = paperMapUpdateSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 422, statusMessage: parsed.error.issues[0]?.message ?? '設定を確認してください。' })
  const source = await loadPaperMapSource(map.id, parsed.data.config.sourceMode, event)
  const record = await prisma.paperMap.update({ where: { id: existing.id }, data: { name: parsed.data.name, config: parsed.data.config as Prisma.InputJsonValue } })
  await appendAuditEvent(prisma, { tenantId: map.tenantId, actorUserId: session.user.id, action: 'PAPER_MAP_UPDATED', targetType: 'PaperMap', targetId: record.id, mapId: map.id })
  return { paperMap: serializePaperMap(record), source, warnings: paperMapWarnings(source, parsed.data.config) }
})
