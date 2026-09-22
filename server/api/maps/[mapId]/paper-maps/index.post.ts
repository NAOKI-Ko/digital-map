import { Prisma } from '~~/prisma/generated/client'
import { paperMapCreateSchema } from '~~/shared/schemas/paper-map'
import type { PaperMapResponse } from '~~/shared/types/paper-map'
import { appendAuditEvent } from '~~/server/utils/audit'
import { defaultNewPaperMapConfig, paperMapWarnings, serializePaperMap } from '~~/server/utils/paper-map'

export default defineEventHandler(async (event): Promise<PaperMapResponse> => {
  const { map, session } = await requireMapAccess(event)
  const parsed = paperMapCreateSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 422, statusMessage: parsed.error.issues[0]?.message ?? '入力内容を確認してください。' })
  const templateId = parsed.data.templateId ?? (parsed.data.purpose === 'MAP_FOCUS' ? 'map-classic' : parsed.data.purpose === 'PHOTO_GUIDE' ? 'photo-story' : 'spot-guide')
  const { source, config } = await defaultNewPaperMapConfig(map.id, templateId, parsed.data.designId)
  const record = await prisma.paperMap.create({ data: { mapId: map.id, createdById: session.user.id, name: parsed.data.name ?? `${source.map.name} 紙マップ`, configVersion: 2, config: config as Prisma.InputJsonValue } })
  await appendAuditEvent(prisma, { tenantId: map.tenantId, actorUserId: session.user.id, action: 'PAPER_MAP_CREATED', targetType: 'PaperMap', targetId: record.id, mapId: map.id, metadata: { templateId: config.templateId, templateVersion: config.templateVersion } })
  setResponseStatus(event, 201)
  return { paperMap: serializePaperMap(record), source, warnings: paperMapWarnings(source, config) }
})
