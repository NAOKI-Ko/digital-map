import type { GeoReferenceFields } from '../../lib/geo'

export interface MapViewerFloor extends GeoReferenceFields {
  id: string
  name: string
  illustrationUrl: string
  isOutdoor: boolean
}
