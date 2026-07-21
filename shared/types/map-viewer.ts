import type { FloorGeoReferenceFields } from '../../lib/geo'

export interface MapViewerFloor extends FloorGeoReferenceFields {
  id: string
  name: string
  illustrationUrl: string
  isOutdoor: boolean
}

export interface MapViewerSpot {
  id: string
  name: string
  category: string
  lat: number
  lng: number
  pinIconType: 'preset' | 'custom'
  pinIconId: string | null
  pinIconImageUrl: string | null
  pinColor: string
}
