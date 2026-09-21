import { appendAuditEvent } from '~~/server/utils/audit'

export default defineEventHandler(async (event) => {
  const { map, session } = await requireMapAccess(event)
  const paperMapId = getRouterParam(event, 'paperMapId')
  const record = await prisma.paperMap.findFirst({ where: { id: paperMapId, mapId: map.id }, select: { id: true } })
  if (!record) throw createError({ statusCode: 404, statusMessage: '紙マップが見つかりません。' })
  await prisma.paperMap.delete({ where: { id: record.id } })
  await appendAuditEvent(prisma, { tenantId: map.tenantId, actorUserId: session.user.id, action: 'PAPER_MAP_DELETED', targetType: 'PaperMap', targetId: record.id, mapId: map.id })
  setResponseStatus(event, 204)
  return null
})
