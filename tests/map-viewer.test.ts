import { describe, expect, it } from 'vitest'
import {
  ABSOLUTE_ZOOM_LIMITS,
  createFloorZoomConstraints,
  createMapViewerOptions,
  getFloorLayerIds,
  getSpotMarkerPresentation,
  VIEWER_CAMERA_CONSTRAINTS,
} from '../app/composables/useMapViewer'
import type { MapViewerSpot } from '../shared/types/map-viewer'

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
})

describe('フロアimageソースの識別子', () => {
  it('sourceとlayerへ衝突しない同一フロア接頭辞を付ける', () => {
    expect(getFloorLayerIds('floor-123')).toEqual({
      sourceId: 'floor-floor-123',
      layerId: 'floor-floor-123-layer',
    })
  })
})
