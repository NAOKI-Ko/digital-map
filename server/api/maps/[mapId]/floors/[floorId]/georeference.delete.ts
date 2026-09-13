import type { MapFloorResponse } from '~~/shared/types/floor'

export default defineEventHandler(async (event): Promise<MapFloorResponse> => {
  const { floor } = await requireOwnedFloor(event)
  const updatedFloor = await prisma.mapFloor.update({
    where: { id: floor.id },
    data: {
      refAImageX: null,
      refAImageY: null,
      refALat: null,
      refALng: null,
      refBImageX: null,
      refBImageY: null,
      refBLat: null,
      refBLng: null,
    },
    include: { _count: { select: { spots: true } } },
  })

  return { floor: toMapFloorItem(updatedFloor) }
})
