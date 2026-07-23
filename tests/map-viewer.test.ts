import { describe, expect, it } from 'vitest'
import {
  ABSOLUTE_ZOOM_LIMITS,
  addMarkerAtPosition,
  createFloorZoomConstraints,
  createMapViewerOptions,
  getFloorLayerIds,
  getSpotMarkerPresentation,
  shouldEnableGeolocate,
  VIEWER_CAMERA_CONSTRAINTS,
} from '../app/composables/useMapViewer'
import type { Map as MapLibreMap } from 'maplibre-gl'
import type { MapViewerFloor, MapViewerSpot } from '../shared/types/map-viewer'

const baseSpot: MapViewerSpot = {
  id: 'spot-1',
  name: 'テストスポット',
  category: '温泉',
  lat: 35.7,
  lng: 139.7,
  pinIconType: 'preset',
  pinIconId: null,
  pinIconImageUrl: null,
  pinColor: '#C7401F',
}

const outdoorFloor: MapViewerFloor = {
  id: 'floor-1',
  name: '屋外',
  illustrationUrl: '/uploads/floor.png',
  isOutdoor: true,
  imageWidth: 1000,
  imageHeight: 500,
  refAPixelX: 0,
  refAPixelY: 0,
  refALat: 35.7,
  refALng: 139.7,
  refBPixelX: 1000,
  refBPixelY: 0,
  refBLat: 35.7,
  refBLng: 139.71,
}

describe('MapViewerのカメラ制約', () => {
  it('閲覧モードへdesign.md 4.2のpitch/bearing制約を渡す', () => {
    const options = createMapViewerOptions('map', 'view')

    expect(options).toMatchObject({
      bearing: 0,
      pitch: 45,
      minPitch: 0,
      maxPitch: 70,
      dragRotate: true,
      touchPitch: true,
      pitchWithRotate: true,
      minZoom: 0,
      maxZoom: 24,
    })
    expect(VIEWER_CAMERA_CONSTRAINTS.view.maxPitch).toBe(70)
  })

  it('編集モードはピン配置しやすい真上視点に固定する', () => {
    expect(createMapViewerOptions('map', 'edit')).toMatchObject({
      bearing: 0,
      pitch: 0,
      minPitch: 0,
      maxPitch: 0,
      dragRotate: false,
      touchPitch: false,
      pitchWithRotate: false,
    })
  })
})

describe('フロアごとのズーム制約', () => {
  it('フィット後のズームから縮小3・拡大4の範囲を作る', () => {
    expect(createFloorZoomConstraints(17)).toEqual({ minZoom: 14, maxZoom: 21 })
  })

  it('MapLibreに設定可能な絶対範囲を越えない', () => {
    expect(createFloorZoomConstraints(-10)).toEqual({ minZoom: 0, maxZoom: 4 })
    expect(createFloorZoomConstraints(30)).toEqual({ minZoom: 21, maxZoom: 24 })
    expect(ABSOLUTE_ZOOM_LIMITS).toEqual({ minZoom: 0, maxZoom: 24 })
  })

  it('非有限値は安全な初期ズームとして扱う', () => {
    expect(createFloorZoomConstraints(Number.NaN)).toEqual({ minZoom: 0, maxZoom: 5 })
  })
})

describe('Markerの表示内容', () => {
  it('カテゴリの既定プリセットと保存色を反映する', () => {
    expect(getSpotMarkerPresentation(baseSpot)).toEqual({
      color: '#C7401F',
      customImageUrl: null,
      symbol: '♨',
    })
  })

  it('カスタムピンでは画像URLを使い文字アイコンを表示しない', () => {
    expect(getSpotMarkerPresentation({
      ...baseSpot,
      pinIconType: 'custom',
      pinIconImageUrl: '/uploads/custom.png',
    })).toEqual({
      color: '#C7401F',
      customImageUrl: '/uploads/custom.png',
      symbol: null,
    })
  })

  it('仮ピンは座標を設定してから地図へ追加する', () => {
    const calls: string[] = []
    const marker = {
      setLngLat(lngLat: [number, number]) {
        calls.push(`setLngLat:${lngLat.join(',')}`)
      },
      addTo() {
        calls.push('addTo')
      },
    }

    expect(addMarkerAtPosition(
      marker,
      {} as MapLibreMap,
      { lat: 35.7, lng: 139.7 },
    )).toBe(marker)
    expect(calls).toEqual(['setLngLat:139.7,35.7', 'addTo'])
  })
})

describe('フロアimageソースの識別子', () => {
  it('sourceとlayerへ衝突しない同一フロア接頭辞を付ける', () => {
    expect(getFloorLayerIds('floor-123')).toEqual({
      sourceId: 'floor-floor-123',
      layerId: 'floor-floor-123-layer',
    })
  })
})

describe('GeolocateControlの追加判定', () => {
  it('ジオリファレンス済みの閲覧モードで有効にする', () => {
    expect(shouldEnableGeolocate(outdoorFloor)).toBe(true)
  })

  it('基準点が未設定なら追加しない', () => {
    expect(shouldEnableGeolocate({ ...outdoorFloor, refALat: null })).toBe(false)
  })

  it('ジオリファレンス済みならピン配置エディタでも有効にする', () => {
    expect(shouldEnableGeolocate(outdoorFloor)).toBe(true)
  })
})
