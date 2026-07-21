import type { MapFloor } from '~~/prisma/generated/client'

type FloorWithCount = MapFloor & {
  _count: { spots: number }
}

export function toMapFloorItem(floor: FloorWithCount) {
  return {
    id: floor.id,
    mapId: floor.mapId,
    name: floor.name,
    illustrationUrl: floor.illustrationUrl,
    order: floor.order,
    topLeftLat: floor.topLeftLat,
    topLeftLng: floor.topLeftLng,
    bottomRightLat: floor.bottomRightLat,
    bottomRightLng: floor.bottomRightLng,
    isOutdoor: floor.isOutdoor,
    spotCount: floor._count.spots,
    createdAt: floor.createdAt.toISOString(),
    updatedAt: floor.updatedAt.toISOString(),
  }
}
