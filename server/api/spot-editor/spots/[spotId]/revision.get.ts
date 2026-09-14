export default defineEventHandler(async (event) => {
  const spotId = getRouterParam(event, 'spotId')
  if (!spotId) throw createError({ statusCode: 400, statusMessage: 'スポットIDが必要です。' })
  const { spot } = await requireAssignedSpotEditor(event, spotId)
  const revision = await prisma.spotRevision.findFirst({ where: { spotId, status: 'PENDING' }, include: { photos: { orderBy: { order: 'asc' } } } })
  return { spot, revision, blockedByPreviousAssignee: Boolean(revision && revision.authorId !== spot.editorAssignment?.userId) }
})
