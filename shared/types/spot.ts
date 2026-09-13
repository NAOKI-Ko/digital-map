import type { PinIconType, PinSize, SpotImportance } from '../constants/spot'
import type { SpotCategorySummary } from './category'
import type { SpotFieldDefinitionItem } from './spot-field'

export interface AdminSpotSummary {
  id: string
  floorId: string
  floorName: string
  name: string
  address: string | null
  categories: SpotCategorySummary[]
  importance: SpotImportance
  x: number | null
  y: number | null
  isPublished: boolean
  pinIconType: PinIconType
  pinIconId: string | null
  pinIconImageUrl: string | null
  pinIconAssetId?: string | null
  pinColor: string
  pinSize: PinSize
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
  address: string | null
  website: string | null
  customValues: Record<string, string | number | boolean | null>
  photos: string[]
  photoAssetIds: Array<string | null>
  hoursText: string | null
  holidayText: string | null
  phone: string | null
  createdAt: string
}

export interface AdminSpotResponse {
  spot: AdminSpotDetail
  floors: SpotListFilterFloor[]
  categories: SpotCategorySummary[]
  fields: SpotFieldDefinitionItem[]
}

export interface SpotPhotosResponse {
  photos: string[]
  assetIds: Array<string | null>
}

export interface SpotPositionResponse {
  position: {
    x: number | null
    y: number | null
  }
}

export interface SpotPinDesignResponse {
  design: {
    pinIconType: PinIconType
    pinIconId: string | null
    pinIconImageUrl: string | null
    pinIconAssetId?: string | null
    pinColor: string
    pinSize: PinSize
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
