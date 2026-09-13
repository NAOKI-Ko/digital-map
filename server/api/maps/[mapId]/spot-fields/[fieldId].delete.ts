export default defineEventHandler(async (event) => {
  const { map } = await requireOwnedMap(event)
  const field = await requireOwnedSpotField(map.id, getRouterParam(event, 'fieldId'))
  if (field.kind === 'standard') throw createError({ statusCode: 409, statusMessage: '標準項目は削除できません。無効にしてください。' })
  if (field._count.values > 0) throw createError({ statusCode: 409, statusMessage: '値が登録済みの項目は削除できません。無効にしてください。' })
  await prisma.spotFieldDefinition.delete({ where: { id: field.id } })
  return { deletedId: field.id }
})
