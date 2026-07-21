export interface MapFloorItem {
  id: string
  mapId: string
  name: string
  illustrationUrl: string
  order: number
  topLeftLat: number | null
  topLeftLng: number | null
  bottomRightLat: number | null
  bottomRightLng: number | null
  isOutdoor: boolean
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
