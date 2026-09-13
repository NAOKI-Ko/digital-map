export default defineEventHandler(async (event) => {
  const { floor } = await requireOwnedFloor(event)
  const id = getRouterParam(event, 'decorationId')
  const result = await prisma.floorDecoration.deleteMany({ where: { id, floorId: floor.id } })
  if (!result.count) throw createError({ statusCode: 404, statusMessage: 'Decorationが見つかりません。' })
  setResponseStatus(event, 204)
  return null
})
