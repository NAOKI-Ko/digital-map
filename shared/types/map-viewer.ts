import type { FloorGeoReferenceFields } from '../../lib/geo'
import type { PinIconType, PinSize, SpotImportance } from '../constants/spot'
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
  importance: SpotImportance
  x: number
  y: number
  pinIconType: PinIconType
  pinIconId: string | null
  pinIconImageUrl: string | null
  pinColor: string
  pinSize?: PinSize
}

export interface MapViewerCameraState {
  center: {
    lat: number
    lng: number
  }
  zoom: number
}

export interface MapViewerDecoration {
  id: string
  imageUrl: string
  imageWidth: number
  imageHeight: number
  x: number
  y: number
  width: number
  rotation: number
  order: number
}
