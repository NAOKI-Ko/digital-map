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

function clampImageCoordinate(value: number) {
  return Math.min(1, Math.max(0, value))
}

export function selectGeoReferenceImagePoint(draft: GeoReferenceDraft, point: 'a' | 'b', x: number, y: number): GeoReferenceDraft {
  const imageX = clampImageCoordinate(x)
  const imageY = clampImageCoordinate(y)
  return point === 'a'
    ? { ...draft, refAImageX: imageX, refAImageY: imageY }
    : { ...draft, refBImageX: imageX, refBImageY: imageY }
}

export function nudgeGeoReferenceImagePoint(draft: GeoReferenceDraft, point: 'a' | 'b', dx: number, dy: number): GeoReferenceDraft {
  const x = point === 'a' ? draft.refAImageX : draft.refBImageX
  const y = point === 'a' ? draft.refAImageY : draft.refBImageY
  return selectGeoReferenceImagePoint(draft, point, (x ?? 0.5) + dx, (y ?? 0.5) + dy)
}

export function selectGeoReferenceMapPoint(draft: GeoReferenceDraft, point: 'a' | 'b', lat: number, lng: number): GeoReferenceDraft {
  return point === 'a'
    ? { ...draft, refALat: lat, refALng: lng }
    : { ...draft, refBLat: lat, refBLng: lng }
}
