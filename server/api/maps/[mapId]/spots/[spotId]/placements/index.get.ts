export default defineEventHandler(async event => {
  const { map, spot } = await requireOwnedSpot(event)
  const placements = await prisma.illustrationPlacement.findMany({ where: { usage: { spotId: spot.id, mapId: map.id } }, include: { floor: { select: { name: true } } }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] })
  return { placements }
})
