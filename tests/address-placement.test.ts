import { describe, expect, it } from 'vitest'
import { getAddressPlacementCandidate } from '../lib/address-placement'
import type { FloorGeoReferenceFields } from '../lib/geo'

const referencedFloor: FloorGeoReferenceFields = {
  imageWidth: 1000,
  imageHeight: 1000,
  refAImageX: 0.2,
  refAImageY: 0.2,
  refALat: 35,
  refALng: 139,
  refBImageX: 0.8,
  refBImageY: 0.2,
  refBLat: 35,
  refBLng: 139.01,
}

describe('住所からの一時PIN候補', () => {
  it('ジオリファレンスがなければ候補を生成しない', () => {
    expect(getAddressPlacementCandidate({ ...referencedFloor, refBLng: null }, { lat: 35, lng: 139 })).toBeNull()
  })

  it('緯度経度をIMAGE x/yへ逆変換する', () => {
    const candidate = getAddressPlacementCandidate(referencedFloor, { lat: 35, lng: 139 })
    expect(candidate?.x).toBeCloseTo(0.2)
    expect(candidate?.y).toBeCloseTo(0.2)
  })

  it('イラスト範囲外の候補を採用しない', () => {
    expect(getAddressPlacementCandidate(referencedFloor, { lat: 36, lng: 140 })).toBeNull()
  })
})
