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
  lat: number | null
  lng: number | null
  isPublished: boolean
  pinSourceMode?: string
  pinSourceCategoryId?: string | null
  pinSourceCategoryName?: string | null
  pinIconType: PinIconType
  pinIconId: string | null
  pinIconImageUrl: string | null
  pinIconAssetId?: string | null
  pinColor: string
  pinSize: PinSize
  updatedAt: string
  photoCount?: number
  liveVersion?: number
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
  englishTranslation?: {
    name: string | null
    description: string | null
    address: string | null
    hoursText: string | null
    holidayText: string | null
    customValues: Record<string, string>
  } | null
  enabledLocales?: Array<'ja' | 'en'>
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
  liveVersion?: number
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
    liveVersion?: number
    pinSourceMode?: string
    pinIconType: PinIconType
    pinIconId: string | null
    pinIconImageUrl: string | null
    pinIconAssetId?: string | null
    pinColor: string
    pinSize: PinSize
    importance: SpotImportance
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
