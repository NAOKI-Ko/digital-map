import type { SpotDuplicateResponse } from '~~/shared/types/spot-duplicate'
export default defineEventHandler(async (event): Promise<SpotDuplicateResponse> => {
  const { map } = await requireOwnedMap(event)
  const query = getQuery(event)
  const name = typeof query.name === 'string' ? query.name.trim() : ''
  const excludeId = typeof query.excludeId === 'string' ? query.excludeId : undefined
  if (!name) return { matches: [] }
  const spots = await prisma.spot.findMany({ where: { name: { equals: name, mode: 'insensitive' }, floor: { mapId: map.id }, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true, name: true, x: true, y: true, floor: { select: { name: true } }, spotCategories: { select: { category: { select: { name: true } } } } }, take: 10 })
  return { matches: spots.map(spot => ({ id: spot.id, name: spot.name, floorName: spot.floor.name, categoryNames: spot.spotCategories.map(item => item.category.name), positioned: spot.x !== null && spot.y !== null })) }
})
