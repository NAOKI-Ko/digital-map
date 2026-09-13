import type { GeoReferenceDraft, GeoReferenceStep } from '~~/shared/types/georeference'

export function createEmptyGeoReferenceDraft(): GeoReferenceDraft {
  return {
    refAImageX: null,
    refAImageY: null,
    refALat: null,
    refALng: null,
    refBImageX: null,
    refBImageY: null,
    refBLat: null,
    refBLng: null,
  }
}

export function getGeoReferenceStep(draft: GeoReferenceDraft): GeoReferenceStep {
  if (draft.refAImageX === null || draft.refAImageY === null) return 'a-image'
  if (draft.refALat === null || draft.refALng === null) return 'a-map'
  if (draft.refBImageX === null || draft.refBImageY === null) return 'b-image'
  if (draft.refBLat === null || draft.refBLng === null) return 'b-map'
  return 'preview'
}

export function isGeoReferenceDraftComplete(draft: GeoReferenceDraft) {
  return getGeoReferenceStep(draft) === 'preview'
}
