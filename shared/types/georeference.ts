export interface GeoReferenceDraft {
  refAPixelX: number | null
  refAPixelY: number | null
  refALat: number | null
  refALng: number | null
  refBPixelX: number | null
  refBPixelY: number | null
  refBLat: number | null
  refBLng: number | null
}

export type GeoReferenceStep = 'a-image' | 'a-map' | 'b-image' | 'b-map' | 'preview'
