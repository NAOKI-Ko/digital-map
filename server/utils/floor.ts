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
    illustrationAssetId: floor.illustrationAssetId,
    imageWidth: floor.imageWidth,
    imageHeight: floor.imageHeight,
    order: floor.order,
    refAImageX: floor.refAImageX,
    refAImageY: floor.refAImageY,
    refALat: floor.refALat,
    refALng: floor.refALng,
    refBImageX: floor.refBImageX,
    refBImageY: floor.refBImageY,
    refBLat: floor.refBLat,
    refBLng: floor.refBLng,
    spotCount: floor._count.spots,
    createdAt: floor.createdAt.toISOString(),
    updatedAt: floor.updatedAt.toISOString(),
  }
}
