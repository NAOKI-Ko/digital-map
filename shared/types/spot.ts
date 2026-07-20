export interface AdminSpotSummary {
  id: string
  floorId: string
  floorName: string
  name: string
  category: string
  lat: number
  lng: number
  isPublished: boolean
  updatedAt: string
}

export interface SpotListFilterFloor {
  id: string
  name: string
}

export interface AdminSpotListResponse {
  spots: AdminSpotSummary[]
  filters: {
    categories: string[]
    floors: SpotListFilterFloor[]
  }
}
