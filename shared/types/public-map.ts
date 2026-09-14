import type { PinIconType, PinSize, SpotImportance } from '../constants/spot'
import type { SpotCategorySummary } from './category'
import type { MapViewerDecoration } from './map-viewer'

export interface PublicSpotInformationField {
  id: string
  label: string
  type: 'single_line_text' | 'multiline_text' | 'number' | 'url' | 'boolean'
  value: string
  href: string | null
}

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
  informationFields: PublicSpotInformationField[]
  websiteAction: { label: string, url: string } | null
  pinIconType: PinIconType
  pinIconId: string | null
  pinIconImageUrl: string | null
  pinColor: string
  pinSize: PinSize
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
  decorations: MapViewerDecoration[]
}

export interface PublicMap {
  id: string
  name: string
  slug: string
  locale: 'ja' | 'en'
  defaultLocale: 'ja'
  enabledLocales: Array<'ja' | 'en'>
  organizationName: string | null
  logoUrl: string | null
  websiteUrl: string | null
  snsUrl: string | null
  floors: PublicFloor[]
}

export interface PublicMapResponse {
  map: PublicMap
}
