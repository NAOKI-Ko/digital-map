import { describe, expect, it } from 'vitest'
import {
  createDefaultGeoReferenceRectangle,
  getFloorGeoReference,
  getGeoReferenceBounds,
  getGeoReferenceValidationError,
  getRectangleCorners,
  isValidGeoReference,
  MAX_GEOREFERENCE_SPAN,
  moveGeoReferenceRectangle,
  resizeGeoReferenceRectangle,
  toImageCoordinates,
  type GeoReferenceFields,
  type GeoReferenceRectangle,
} from '../lib/geo'

const validRectangle: GeoReferenceRectangle = {
  topLeft: { lat: 35.7, lng: 139.7 },
  bottomRight: { lat: 35.6, lng: 139.8 },
}

const validFloor: GeoReferenceFields = {
  topLeftLat: 35.7,
  topLeftLng: 139.7,
  bottomRightLat: 35.6,
  bottomRightLng: 139.8,
}

describe('矩形ジオリファレンスの変換', () => {
  it('保存する2点から軸に沿った4隅を算出する', () => {
    expect(getRectangleCorners(validRectangle)).toEqual({
      topLeft: { lat: 35.7, lng: 139.7 },
      topRight: { lat: 35.7, lng: 139.8 },
      bottomRight: { lat: 35.6, lng: 139.8 },
      bottomLeft: { lat: 35.6, lng: 139.7 },
    })
  })

  it('MapLibre image sourceの順序と[lng, lat]形式へ変換する', () => {
    expect(toImageCoordinates(validRectangle)).toEqual([
      [139.7, 35.7],
      [139.8, 35.7],
      [139.8, 35.6],
      [139.7, 35.6],
    ])
  })

  it('フロアの4座標から矩形を復元する', () => {
    expect(getFloorGeoReference(validFloor)).toEqual(validRectangle)
  })

  it('座標が1つでもnullなら未設定として扱う', () => {
    expect(getFloorGeoReference({ ...validFloor, bottomRightLng: null })).toBeNull()
  })

  it('fitBounds用の南西・北東座標を返す', () => {
    expect(getGeoReferenceBounds(validRectangle)).toEqual({
      southwest: [139.7, 35.6],
      northeast: [139.8, 35.7],
    })
  })
})

describe('矩形ジオリファレンスのバリデーション', () => {
  it('有効な左上・右下を受け入れる', () => {
    expect(isValidGeoReference(validRectangle)).toBe(true)
    expect(getGeoReferenceValidationError(validRectangle)).toBeNull()
  })

  it.each([
    ['緯度の上下逆転', { topLeft: { lat: 35.5, lng: 139.7 }, bottomRight: { lat: 35.6, lng: 139.8 } }],
    ['経度の左右逆転', { topLeft: { lat: 35.7, lng: 139.9 }, bottomRight: { lat: 35.6, lng: 139.8 } }],
    ['緯度範囲外', { topLeft: { lat: 91, lng: 139.7 }, bottomRight: { lat: 35.6, lng: 139.8 } }],
    ['日付変更線をまたぐ矩形', { topLeft: { lat: 35.7, lng: 179.9 }, bottomRight: { lat: 35.6, lng: -179.9 } }],
    ['高さが大きすぎる', { topLeft: { lat: 38, lng: 139.7 }, bottomRight: { lat: 35.6, lng: 139.8 } }],
    ['幅が大きすぎる', { topLeft: { lat: 35.7, lng: 137 }, bottomRight: { lat: 35.6, lng: 139.8 } }],
    ['幅ゼロ', { topLeft: { lat: 35.7, lng: 139.8 }, bottomRight: { lat: 35.6, lng: 139.8 } }],
  ] as const)('%sを拒否する', (_label, rectangle) => {
    expect(isValidGeoReference(rectangle)).toBe(false)
  })
})

describe('矩形の初期配置・移動・リサイズ', () => {
  it('表示範囲中央へ40%の初期矩形を作る', () => {
    const rectangle = createDefaultGeoReferenceRectangle({
      southwest: { lat: 35, lng: 139 },
      northeast: { lat: 36, lng: 140 },
    })
    expect(rectangle.topLeft.lat).toBeCloseTo(35.7)
    expect(rectangle.topLeft.lng).toBeCloseTo(139.3)
    expect(rectangle.bottomRight.lat).toBeCloseTo(35.3)
    expect(rectangle.bottomRight.lng).toBeCloseTo(139.7)
  })

  it('世界表示でも初期矩形を最大2度以内に抑える', () => {
    const rectangle = createDefaultGeoReferenceRectangle({
      southwest: { lat: -85, lng: -180 },
      northeast: { lat: 85, lng: 180 },
    })
    expect(rectangle.topLeft.lat - rectangle.bottomRight.lat).toBe(MAX_GEOREFERENCE_SPAN)
    expect(rectangle.bottomRight.lng - rectangle.topLeft.lng).toBe(MAX_GEOREFERENCE_SPAN)
  })

  it('右上ハンドルを動かしても4辺を軸に沿わせる', () => {
    const resized = resizeGeoReferenceRectangle(validRectangle, 'topRight', {
      lat: 35.75,
      lng: 139.85,
    })
    expect(resized).toEqual({
      topLeft: { lat: 35.75, lng: 139.7 },
      bottomRight: { lat: 35.6, lng: 139.85 },
    })
    expect(getRectangleCorners(resized).topRight).toEqual({ lat: 35.75, lng: 139.85 })
  })

  it('矩形移動では幅と高さを保つ', () => {
    const moved = moveGeoReferenceRectangle(validRectangle, { lat: 0.2, lng: -0.3 })
    expect(moved.topLeft.lat).toBeCloseTo(35.9)
    expect(moved.topLeft.lng).toBeCloseTo(139.4)
    expect(moved.bottomRight.lat).toBeCloseTo(35.8)
    expect(moved.bottomRight.lng).toBeCloseTo(139.5)
    expect(moved.topLeft.lat - moved.bottomRight.lat).toBeCloseTo(0.1)
    expect(moved.bottomRight.lng - moved.topLeft.lng).toBeCloseTo(0.1)
  })
})
