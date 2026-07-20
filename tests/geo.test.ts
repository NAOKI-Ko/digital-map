import { describe, expect, it } from 'vitest'
import {
  getFloorGeoReference,
  isValidGeoReference,
  toImageCoordinates,
  type GeoReferenceCoordinates,
  type GeoReferenceFields,
} from '../lib/geo'

const validCoordinates: GeoReferenceCoordinates = {
  topLeft: { lat: 35.7, lng: 139.7 },
  topRight: { lat: 35.7, lng: 139.8 },
  bottomRight: { lat: 35.6, lng: 139.8 },
  bottomLeft: { lat: 35.6, lng: 139.7 },
}

const validFloor: GeoReferenceFields = {
  topLeftLat: 35.7,
  topLeftLng: 139.7,
  topRightLat: 35.7,
  topRightLng: 139.8,
  bottomRightLat: 35.6,
  bottomRightLng: 139.8,
  bottomLeftLat: 35.6,
  bottomLeftLng: 139.7,
}

describe('ジオリファレンス変換', () => {
  it('MapLibre image sourceの順序と[lng, lat]形式へ変換する', () => {
    expect(toImageCoordinates(validCoordinates)).toEqual([
      [139.7, 35.7],
      [139.8, 35.7],
      [139.8, 35.6],
      [139.7, 35.6],
    ])
  })

  it('フロアの8座標から四隅を復元する', () => {
    expect(getFloorGeoReference(validFloor)).toEqual(validCoordinates)
  })

  it('座標が1つでもnullなら未設定として扱う', () => {
    expect(getFloorGeoReference({ ...validFloor, bottomLeftLng: null })).toBeNull()
  })
})

describe('ジオリファレンスのバリデーション', () => {
  it('有効な四隅を受け入れる', () => {
    expect(isValidGeoReference(validCoordinates)).toBe(true)
  })

  it.each([
    ['緯度範囲外', { ...validCoordinates, topLeft: { lat: 91, lng: 139.7 } }],
    ['経度範囲外', { ...validCoordinates, topRight: { lat: 35.7, lng: 181 } }],
    ['重複点', { ...validCoordinates, topRight: validCoordinates.topLeft }],
    ['面積ゼロ', {
      topLeft: { lat: 35.7, lng: 139.7 },
      topRight: { lat: 35.7, lng: 139.8 },
      bottomRight: { lat: 35.7, lng: 139.9 },
      bottomLeft: { lat: 35.7, lng: 140 },
    }],
    ['自己交差', {
      topLeft: { lat: 35.7, lng: 139.7 },
      topRight: { lat: 35.6, lng: 139.8 },
      bottomRight: { lat: 35.7, lng: 139.8 },
      bottomLeft: { lat: 35.6, lng: 139.7 },
    }],
  ] as const)('%sを拒否する', (_label, coordinates) => {
    expect(isValidGeoReference(coordinates)).toBe(false)
  })
})
