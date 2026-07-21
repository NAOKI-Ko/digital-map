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
    imageWidth: floor.imageWidth,
    imageHeight: floor.imageHeight,
    order: floor.order,
    refAPixelX: floor.refAPixelX,
    refAPixelY: floor.refAPixelY,
    refALat: floor.refALat,
    refALng: floor.refALng,
    refBPixelX: floor.refBPixelX,
    refBPixelY: floor.refBPixelY,
    refBLat: floor.refBLat,
    refBLng: floor.refBLng,
    isOutdoor: floor.isOutdoor,
    spotCount: floor._count.spots,
    createdAt: floor.createdAt.toISOString(),
    updatedAt: floor.updatedAt.toISOString(),
  }
}
