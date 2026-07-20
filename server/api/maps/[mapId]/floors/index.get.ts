import type { MapFloorListResponse } from '~~/shared/types/floor'

export default defineEventHandler(async (event): Promise<MapFloorListResponse> => {
  const { map } = await requireOwnedMap(event)
  const floors = await prisma.mapFloor.findMany({
    where: { mapId: map.id },
    include: { _count: { select: { spots: true } } },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })

  return { floors: floors.map(toMapFloorItem) }
})
