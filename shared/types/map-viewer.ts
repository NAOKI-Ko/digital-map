import type { FloorGeoReferenceFields } from '../../lib/geo'
import type { PinIconType } from '../constants/spot'

export interface MapViewerFloor extends FloorGeoReferenceFields {
  id: string
  name: string
  illustrationUrl: string
}

export interface MapViewerSpot {
  id: string
  name: string
  category: string
  lat: number
  lng: number
  pinIconType: PinIconType
  pinIconId: string | null
  pinIconImageUrl: string | null
  pinColor: string
}
