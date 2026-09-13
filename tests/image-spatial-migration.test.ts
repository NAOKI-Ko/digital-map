import { describe, expect, it } from 'vitest'
import { imageToRenderCoordinates, snapMigrationImageCoordinate } from '../lib/geo'
import {
  invertLegacySpotPosition,
  isMigrationImagePositionInBounds,
  normalizeLegacyFloorReference,
  type LegacyFloorSpatialFields,
} from '../lib/image-spatial-migration'

const legacyGeoFloor: LegacyFloorSpatialFields = {
  imageWidth: 1000,
  imageHeight: 500,
  refAPixelX: 100,
  refAPixelY: 50,
  refALat: 35,
  refALng: 139,
  refBPixelX: 900,
  refBPixelY: 100,
  refBLat: 35.005,
  refBLng: 139.01,
}

describe('legacy IMAGE spatial migration', () => {
  it('pixel reference pointsをnormalized IMAGE coordinatesへ変換する', () => {
    expect(normalizeLegacyFloorReference(legacyGeoFloor)).toMatchObject({
      refAImageX: 0.1,
      refAImageY: 0.1,
      refBImageX: 0.9,
      refBImageY: 0.2,
    })
  })

  it.each([
    { x: 0, y: 0 },
    { x: 0.5, y: 0.5 },
    { x: 1, y: 1 },
  ])('georeferenced current visible pointを同じIMAGE位置へ戻す: $x,$y', (expected) => {
    const normalizedFloor = normalizeLegacyFloorReference(legacyGeoFloor)
    const rendered = imageToRenderCoordinates(normalizedFloor, expected)
    expect(rendered).not.toBeNull()
    const migrated = invertLegacySpotPosition(legacyGeoFloor, rendered!)
    expect(migrated?.x).toBeCloseTo(expected.x, 11)
    expect(migrated?.y).toBeCloseTo(expected.y, 11)
  })

  it('fallback current visible pointを同じIMAGE位置へ戻す', () => {
    const fallbackFloor = {
      ...legacyGeoFloor,
      refAPixelX: null,
      refAPixelY: null,
      refALat: null,
      refALng: null,
      refBPixelX: null,
      refBPixelY: null,
      refBLat: null,
      refBLng: null,
    }
    expect(invertLegacySpotPosition(fallbackFloor, { lat: 0, lng: 0 })).toEqual({ x: 0.5, y: 0.5 })
  })

  it('1e-12以内だけを境界ノイズとして許容する', () => {
    expect(snapMigrationImageCoordinate(-1e-13)).toBe(0)
    expect(snapMigrationImageCoordinate(5e-13)).toBe(0)
    expect(snapMigrationImageCoordinate(0.9999999999995)).toBe(1)
    expect(snapMigrationImageCoordinate(1.0000000000005)).toBe(1)
    expect(snapMigrationImageCoordinate(-1e-10)).toBe(-1e-10)
    expect(snapMigrationImageCoordinate(1.0000000001)).toBe(1.0000000001)
    expect(isMigrationImagePositionInBounds({ x: -5e-13, y: 1 + 5e-13 })).toBe(true)
    expect(isMigrationImagePositionInBounds({ x: -1e-10, y: 0.5 })).toBe(false)
    expect(isMigrationImagePositionInBounds({ x: 0.5, y: 1.0000000001 })).toBe(false)
  })

  it('dimensionが不正なら変換しない', () => {
    expect(invertLegacySpotPosition({ ...legacyGeoFloor, imageWidth: 0 }, { lat: 35, lng: 139 })).toBeNull()
  })
})
