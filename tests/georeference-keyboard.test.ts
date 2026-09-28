import { describe, expect, it } from 'vitest'
import { createEmptyGeoReferenceDraft, getGeoReferenceStep, nudgeGeoReferenceImagePoint, selectGeoReferenceImagePoint, selectGeoReferenceMapPoint } from '../app/composables/useGeoReference'

describe('Georeference pointer and keyboard candidate operations', () => {
  it('uses the same illustration candidate fields for click selection and keyboard nudging', () => {
    const clicked = selectGeoReferenceImagePoint(createEmptyGeoReferenceDraft(), 'a', 0.25, 0.75)
    expect(getGeoReferenceStep(clicked)).toBe('a-map')
    expect(nudgeGeoReferenceImagePoint(clicked, 'a', 0.005, -0.02)).toMatchObject({ refAImageX: 0.255, refAImageY: 0.73 })
    expect(nudgeGeoReferenceImagePoint(createEmptyGeoReferenceDraft(), 'a', 0, 0)).toMatchObject({ refAImageX: 0.5, refAImageY: 0.5 })
  })

  it('clamps image points and preserves the other point', () => {
    const selected = selectGeoReferenceImagePoint(createEmptyGeoReferenceDraft(), 'b', 1.5, -0.2)
    expect(selected).toMatchObject({ refAImageX: null, refAImageY: null, refBImageX: 1, refBImageY: 0 })
  })

  it('commits pointer and map-center coordinates through one domain draft path', () => {
    const imageA = selectGeoReferenceImagePoint(createEmptyGeoReferenceDraft(), 'a', 0.2, 0.3)
    const mapA = selectGeoReferenceMapPoint(imageA, 'a', 35.1, 136.9)
    const imageB = selectGeoReferenceImagePoint(mapA, 'b', 0.8, 0.7)
    const mapB = selectGeoReferenceMapPoint(imageB, 'b', 35.2, 137)
    expect(getGeoReferenceStep(mapB)).toBe('preview')
    expect(mapB).toMatchObject({ refALat: 35.1, refALng: 136.9, refBLat: 35.2, refBLng: 137 })
  })
})
