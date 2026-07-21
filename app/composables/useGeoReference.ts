import type { GeoReferenceDraft, GeoReferenceStep } from '~~/shared/types/georeference'

export function createEmptyGeoReferenceDraft(): GeoReferenceDraft {
  return {
    refAPixelX: null,
    refAPixelY: null,
    refALat: null,
    refALng: null,
    refBPixelX: null,
    refBPixelY: null,
    refBLat: null,
    refBLng: null,
  }
}

export function getGeoReferenceStep(draft: GeoReferenceDraft): GeoReferenceStep {
  if (draft.refAPixelX === null || draft.refAPixelY === null) return 'a-image'
  if (draft.refALat === null || draft.refALng === null) return 'a-map'
  if (draft.refBPixelX === null || draft.refBPixelY === null) return 'b-image'
  if (draft.refBLat === null || draft.refBLng === null) return 'b-map'
  return 'preview'
}

export function isGeoReferenceDraftComplete(draft: GeoReferenceDraft) {
  return getGeoReferenceStep(draft) === 'preview'
}
