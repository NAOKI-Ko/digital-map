import { describe, expect, it } from 'vitest'
import {
  computeFloorCorners,
  getFloorCorners,
  getGeoReferenceBounds,
  getGeoReferenceValidationError,
  REFERENCE_DISTANCE_ERROR,
  toImageCoordinates,
  type CompleteFloorGeoReference,
} from '../lib/geo'

const baseFloor: CompleteFloorGeoReference = {
  imageWidth: 1000,
  imageHeight: 500,
  refAPixelX: 0,
  refAPixelY: 0,
  refALat: 35,
  refALng: 139,
  refBPixelX: 1000,
  refBPixelY: 0,
  refBLat: 35,
  refBLng: 139.01,
}

function floor(overrides: Partial<CompleteFloorGeoReference> = {}): CompleteFloorGeoReference {
  return { ...baseFloor, ...overrides }
}

describe('computeFloorCorners', () => {
  it('東西方向だけに離れた基準点から4隅を算出する', () => {
    const corners = computeFloorCorners(floor())

    expect(corners.topLeft).toEqual({ lat: 35, lng: 139 })
    expect(corners.topRight.lat).toBeCloseTo(35, 8)
    expect(corners.topRight.lng).toBeCloseTo(139.01, 8)
    expect(corners.bottomLeft.lat).toBeLessThan(corners.topLeft.lat)
    expect(corners.bottomLeft.lng).toBeCloseTo(139, 8)
  })

  it('南北方向だけに離れた基準点を90度回転として扱う', () => {
    const corners = computeFloorCorners(floor({ refBLat: 35.01, refBLng: 139 }))

    expect(corners.topRight.lat).toBeCloseTo(35.01, 8)
    expect(corners.topRight.lng).toBeCloseTo(139, 8)
    expect(corners.bottomLeft.lng).toBeGreaterThan(corners.topLeft.lng)
  })

  it('斜め方向に離れた基準点の対応を維持する', () => {
    const corners = computeFloorCorners(floor({
      imageHeight: 1000,
      refBPixelY: 1000,
      refBLat: 35.01,
      refBLng: 139.01,
    }))

    expect(corners.topLeft.lat).toBeCloseTo(35, 8)
    expect(corners.topLeft.lng).toBeCloseTo(139, 8)
    expect(corners.bottomRight.lat).toBeCloseTo(35.01, 8)
    expect(corners.bottomRight.lng).toBeCloseTo(139.01, 8)
  })

  it('180度回転でも画像の向きと一様縮尺を保つ', () => {
    const corners = computeFloorCorners(floor({ refBLng: 138.99 }))

    expect(corners.topRight.lng).toBeCloseTo(138.99, 8)
    expect(corners.topRight.lat).toBeCloseTo(35, 8)
    expect(corners.bottomLeft.lat).toBeGreaterThan(corners.topLeft.lat)
  })

  it('極端に大きい縮尺でも有限な4隅を返す', () => {
    const corners = computeFloorCorners(floor({ refBPixelX: 50, refBLng: 140 }))

    for (const point of Object.values(corners)) {
      expect(Number.isFinite(point.lat)).toBe(true)
      expect(Number.isFinite(point.lng)).toBe(true)
    }
    expect(Math.abs(corners.topRight.lng - corners.topLeft.lng)).toBeGreaterThan(10)
  })

  it('極端に小さい縮尺でも有限な4隅を返す', () => {
    const twentyFiveMetersInDegrees = 25 / 111_319.490_793_273_57
    const corners = computeFloorCorners(floor({
      refBLat: 35 + twentyFiveMetersInDegrees,
      refBLng: 139,
    }))

    expect(Math.abs(corners.topRight.lat - corners.topLeft.lat)).toBeLessThan(0.001)
    expect(Math.abs(corners.bottomLeft.lng - corners.topLeft.lng)).toBeLessThan(0.001)
  })

  it.each([
    ['ピクセル距離が50未満', { refBPixelX: 49 }],
    ['実距離が20m未満', { refBPixelX: 100, refBLat: 35 + 10 / 111_319.490_793_273_57, refBLng: 139 }],
  ])('%sならエラーにする', (_label, overrides) => {
    expect(() => computeFloorCorners(floor(overrides))).toThrow(REFERENCE_DISTANCE_ERROR)
  })

  it('基準点AとBが完全に同一ならエラーにする', () => {
    expect(() => computeFloorCorners(floor({
      refBPixelX: 0,
      refBPixelY: 0,
      refBLat: 35,
      refBLng: 139,
    }))).toThrow(REFERENCE_DISTANCE_ERROR)
  })
})

describe('2点合わせのバリデーションとMapLibre変換', () => {
  it('画像外のピクセル座標を拒否する', () => {
    expect(getGeoReferenceValidationError(floor({ refBPixelX: 1001 })))
      .toBe('イラスト上の基準点を画像の内側で選んでください。')
  })

  it('値が1つでもnullなら未設定として扱う', () => {
    expect(getFloorCorners({ ...baseFloor, refBLng: null })).toBeNull()
  })

  it('4隅をMapLibre image sourceの順序と[lng, lat]形式へ変換する', () => {
    const corners = computeFloorCorners(floor())
    expect(toImageCoordinates(corners)).toEqual([
      [corners.topLeft.lng, corners.topLeft.lat],
      [corners.topRight.lng, corners.topRight.lat],
      [corners.bottomRight.lng, corners.bottomRight.lat],
      [corners.bottomLeft.lng, corners.bottomLeft.lat],
    ])
  })

  it('回転した4隅全体を含むfitBounds用範囲を返す', () => {
    const corners = computeFloorCorners(floor({ refBLat: 35.01, refBLng: 139 }))
    const bounds = getGeoReferenceBounds(corners)
    const points = Object.values(corners)

    expect(bounds.southwest[0]).toBe(Math.min(...points.map(point => point.lng)))
    expect(bounds.southwest[1]).toBe(Math.min(...points.map(point => point.lat)))
    expect(bounds.northeast[0]).toBe(Math.max(...points.map(point => point.lng)))
    expect(bounds.northeast[1]).toBe(Math.max(...points.map(point => point.lat)))
  })
})
