import { Prisma } from '~~/prisma/generated/client'
import { paperDesignRequestSchema } from '~~/shared/schemas/paper-map'
import { appendAuditEvent } from '~~/server/utils/audit'

export default defineEventHandler(async (event) => {
  const { map, session } = await requireMapAccess(event)
  const parsed = paperDesignRequestSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 422, statusMessage: parsed.error.issues[0]?.message ?? '入力内容を確認してください。' })
  if (parsed.data.paperMapId) {
    const exists = await prisma.paperMap.count({ where: { id: parsed.data.paperMapId, mapId: map.id } })
    if (!exists) throw createError({ statusCode: 404, statusMessage: '紙マップが見つかりません。' })
  }
  const { paperMapId, ...requirements } = parsed.data
  const record = await prisma.paperDesignRequest.create({ data: { mapId: map.id, paperMapId, requestedBy: session.user.id, requirements: requirements as Prisma.InputJsonValue } })
  await appendAuditEvent(prisma, { tenantId: map.tenantId, actorUserId: session.user.id, action: 'PAPER_DESIGN_REQUESTED', targetType: 'PaperDesignRequest', targetId: record.id, mapId: map.id, metadata: { paperMapId } })
  setResponseStatus(event, 201)
  return { request: { id: record.id, status: record.status, createdAt: record.createdAt.toISOString() } }
})
