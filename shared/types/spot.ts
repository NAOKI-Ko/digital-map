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

export interface AdminSpotDetail extends AdminSpotSummary {
  description: string | null
  photos: string[]
  hoursText: string | null
  holidayText: string | null
  phone: string | null
  pinIconType: 'preset' | 'custom'
  pinIconId: string | null
  pinIconImageUrl: string | null
  pinColor: string
  createdAt: string
}

export interface AdminSpotResponse {
  spot: AdminSpotDetail
  floors: SpotListFilterFloor[]
}
