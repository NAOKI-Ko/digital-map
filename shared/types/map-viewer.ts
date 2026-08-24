import type { FloorGeoReferenceFields } from '../../lib/geo'
import type { PinIconType } from '../constants/spot'
import type { SpotCategorySummary } from './category'

export interface MapViewerFloor extends FloorGeoReferenceFields {
  id: string
  name: string
  illustrationUrl: string
}

export interface MapViewerSpot {
  id: string
  name: string
  categories: SpotCategorySummary[]
  lat: number
  lng: number
  pinIconType: PinIconType
  pinIconId: string | null
  pinIconImageUrl: string | null
  pinColor: string
}

export interface MapViewerCameraState {
  center: {
    lat: number
    lng: number
  }
  zoom: number
}
