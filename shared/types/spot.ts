import type { PinIconType, SpotImportance } from '../constants/spot'
import type { SpotCategorySummary } from './category'

export interface AdminSpotSummary {
  id: string
  floorId: string
  floorName: string
  name: string
  categories: SpotCategorySummary[]
  importance: SpotImportance
  x: number | null
  y: number | null
  isPublished: boolean
  pinIconType: PinIconType
  pinIconId: string | null
  pinIconImageUrl: string | null
  pinColor: string
  updatedAt: string
}

export type PositionedAdminSpotSummary = AdminSpotSummary & {
  x: number
  y: number
}

export interface SpotListFilterFloor {
  id: string
  name: string
}

export interface AdminSpotListResponse {
  spots: AdminSpotSummary[]
  filters: {
    categories: SpotCategorySummary[]
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
  categories: SpotCategorySummary[]
}

export interface SpotPhotosResponse {
  photos: string[]
}

export interface SpotPositionResponse {
  position: {
    x: number
    y: number
  }
}

export interface SpotPinDesignResponse {
  design: {
    pinIconType: PinIconType
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

export interface SpotBulkResponse {
  updatedCount: number
}
