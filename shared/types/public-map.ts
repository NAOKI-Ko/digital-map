import type { PinIconType, SpotImportance } from '../constants/spot'
import type { SpotCategorySummary } from './category'

export interface PublicSpot {
  id: string
  floorId: string
  name: string
  categories: SpotCategorySummary[]
  importance: SpotImportance
  description: string | null
  x: number
  y: number
  photos: string[]
  hoursText: string | null
  holidayText: string | null
  phone: string | null
  pinIconType: PinIconType
  pinIconId: string | null
  pinIconImageUrl: string | null
  pinColor: string
}

export interface PublicFloor {
  id: string
  name: string
  illustrationUrl: string
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
  spots: PublicSpot[]
}

export interface PublicMap {
  id: string
  name: string
  slug: string
  organizationName: string | null
  logoUrl: string | null
  websiteUrl: string | null
  snsUrl: string | null
  floors: PublicFloor[]
}

export interface PublicMapResponse {
  map: PublicMap
}
