export interface MapFloorItem {
  id: string
  mapId: string
  name: string
  illustrationUrl: string
  illustrationAssetId?: string | null
  imageWidth: number
  imageHeight: number
  order: number
  refAImageX: number | null
  refAImageY: number | null
  refALat: number | null
  refALng: number | null
  refBImageX: number | null
  refBImageY: number | null
  refBLat: number | null
  refBLng: number | null
  spotCount: number
  createdAt: string
  updatedAt: string
}

export interface MapFloorResponse {
  floor: MapFloorItem
}

export interface MapFloorListResponse {
  floors: MapFloorItem[]
}
