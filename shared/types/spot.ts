export interface AdminSpotSummary {
  id: string
  floorId: string
  floorName: string
  name: string
  category: string
  lat: number | null
  lng: number | null
  isPublished: boolean
  pinIconType: 'preset' | 'custom'
  pinIconId: string | null
  pinIconImageUrl: string | null
  pinColor: string
  updatedAt: string
}

export type PositionedAdminSpotSummary = AdminSpotSummary & {
  lat: number
  lng: number
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
  createdAt: string
}

export interface AdminSpotResponse {
  spot: AdminSpotDetail
  floors: SpotListFilterFloor[]
}

export interface SpotPhotosResponse {
  photos: string[]
}

export interface SpotPositionResponse {
  position: {
    lat: number
    lng: number
  }
}

export interface SpotPinDesignResponse {
  design: {
    pinIconType: 'preset' | 'custom'
    pinIconId: string | null
    pinIconImageUrl: string | null
    pinColor: string
  }
}

export interface SpotPublishResponse {
  publication: {
    isPublished: boolean
    updatedAt: string
  }
}
