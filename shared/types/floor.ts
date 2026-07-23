export interface MapFloorItem {
  id: string
  mapId: string
  name: string
  illustrationUrl: string
  imageWidth: number
  imageHeight: number
  order: number
  refAPixelX: number | null
  refAPixelY: number | null
  refALat: number | null
  refALng: number | null
  refBPixelX: number | null
  refBPixelY: number | null
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
