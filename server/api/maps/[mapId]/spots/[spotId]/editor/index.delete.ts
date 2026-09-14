export default defineEventHandler(async (event) => {
  const { spot } = await requireOwnedSpot(event)
  await prisma.spotEditorAssignment.deleteMany({ where: { spotId: spot.id } })
  return { removed: true }
})
