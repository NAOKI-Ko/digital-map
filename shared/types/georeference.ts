export interface GeoReferenceDraft {
  refAImageX: number | null
  refAImageY: number | null
  refALat: number | null
  refALng: number | null
  refBImageX: number | null
  refBImageY: number | null
  refBLat: number | null
  refBLng: number | null
}

export type GeoReferenceStep = 'a-image' | 'a-map' | 'b-image' | 'b-map' | 'preview'
