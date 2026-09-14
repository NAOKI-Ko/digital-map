export default defineEventHandler(async (event) => {
  const { map, session } = await requireOwnedMap(event)
  const field = await requireOwnedSpotField(map.id, getRouterParam(event, 'fieldId'))
  if (field.kind === 'standard') throw createError({ statusCode: 409, statusMessage: '標準項目は削除できません。無効にしてください。' })
  if (field._count.values > 0) throw createError({ statusCode: 409, statusMessage: '値が登録済みの項目は削除できません。無効にしてください。' })
  await prisma.$transaction(async (tx) => {
    await tx.spotFieldDefinition.delete({ where: { id: field.id } })
    await appendAuditEvent(tx, { tenantId: map.tenantId, actorUserId: session.user.id, action: 'SPOT_FIELD_DEFINITION_DELETED', targetType: 'SpotFieldDefinition', targetId: field.id, mapId: map.id, metadata: { usageCount: field._count.values } })
  })
  return { deletedId: field.id }
})
