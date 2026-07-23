import { describe, expect, it } from 'vitest'
import {
  ABSOLUTE_ZOOM_LIMITS,
  addMarkerAtPosition,
  createFloorZoomConstraints,
  createMapViewerOptions,
  GEOLOCATE_CONTROL_OPTIONS,
  GEOLOCATION_OUTSIDE_MESSAGE,
  getFloorLayerIds,
  shouldEnableGeolocate,
  VIEWER_CAMERA_CONSTRAINTS,
  ZOOM_IN_ALLOWANCE,
  ZOOM_OUT_ALLOWANCE,
} from '../app/composables/useMapViewer'
import { getSpotMarkerPresentation } from '../app/utils/marker-element'
import type { Map as MapLibreMap } from 'maplibre-gl'
import type { MapViewerFloor, MapViewerSpot } from '../shared/types/map-viewer'
import { getPinColorVariants, mixHexColor } from '../shared/utils/pin-style'

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

const geoReferencedFloor: MapViewerFloor = {
  id: 'floor-1',
  name: 'ジオリファレンス設定済み',
  illustrationUrl: '/uploads/floor.png',
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
  it('フィット後のズームから縮小2.5・拡大6の範囲を作る', () => {
    expect(createFloorZoomConstraints(17)).toEqual({ minZoom: 14.5, maxZoom: 23 })
    expect(ZOOM_OUT_ALLOWANCE).toBe(2.5)
    expect(ZOOM_IN_ALLOWANCE).toBe(6)
  })

  it('MapLibreに設定可能な絶対範囲を越えない', () => {
    expect(createFloorZoomConstraints(-10)).toEqual({ minZoom: 0, maxZoom: 6 })
    expect(createFloorZoomConstraints(30)).toEqual({ minZoom: 21.5, maxZoom: 24 })
    expect(ABSOLUTE_ZOOM_LIMITS).toEqual({ minZoom: 0, maxZoom: 24 })
  })

  it('非有限値は安全な初期ズームとして扱う', () => {
    expect(createFloorZoomConstraints(Number.NaN)).toEqual({ minZoom: 0, maxZoom: 7 })
  })
})

describe('Markerの表示内容', () => {
  it('カテゴリの既定プリセットと保存色を反映する', () => {
    expect(getSpotMarkerPresentation(baseSpot)).toEqual({
      type: 'preset',
      color: '#C7401F',
      lightColor: '#DD8C79',
      darkColor: '#772613',
      imageUrl: null,
      iconFamily: 'kanji',
      symbol: '♨',
    })
  })

  it('Material Symbolsの保存値をグリフ名とfamilyへ分解する', () => {
    expect(getSpotMarkerPresentation({
      ...baseSpot,
      pinIconId: 'material:hot_tub',
    })).toMatchObject({
      type: 'preset',
      iconFamily: 'material',
      symbol: 'hot_tub',
    })
  })

  it('カスタムピンでは画像URLを使い文字アイコンを表示しない', () => {
    expect(getSpotMarkerPresentation({
      ...baseSpot,
      pinIconType: 'custom',
      pinIconImageUrl: '/uploads/custom.png',
    })).toEqual({
      type: 'custom',
      color: '#C7401F',
      lightColor: '#DD8C79',
      darkColor: '#772613',
      imageUrl: '/uploads/custom.png',
      iconFamily: null,
      symbol: null,
    })
  })

  it('イラスト直置きでは台座用文字を使わず画像URLを返す', () => {
    expect(getSpotMarkerPresentation({
      ...baseSpot,
      pinIconType: 'illustration',
      pinIconImageUrl: '/uploads/illustration.png',
    })).toEqual({
      type: 'illustration',
      color: '#C7401F',
      lightColor: '#DD8C79',
      darkColor: '#772613',
      imageUrl: '/uploads/illustration.png',
      iconFamily: null,
      symbol: null,
    })
  })

  it('画像URLが欠けた保存データは壊れた画像ではなくpresetへ戻す', () => {
    expect(getSpotMarkerPresentation({
      ...baseSpot,
      pinIconType: 'illustration',
      pinIconImageUrl: null,
    }).type).toBe('preset')
  })

  it('color-mix非対応環境向けに明色と暗色をsRGBで算出する', () => {
    expect(getPinColorVariants('#2563eb')).toEqual({
      base: '#2563EB',
      light: '#7CA1F3',
      dark: '#163B8D',
    })
    expect(mixHexColor('#000000', 'white')).toBe('#666666')
    expect(mixHexColor('#FFFFFF', 'black')).toBe('#999999')
  })

  it('不正な保存色は既定色へフォールバックする', () => {
    expect(getPinColorVariants('not-a-color')).toEqual({
      base: '#C7401F',
      light: '#DD8C79',
      dark: '#772613',
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
    expect(shouldEnableGeolocate(geoReferencedFloor)).toBe(true)
  })

  it('基準点が未設定なら追加しない', () => {
    expect(shouldEnableGeolocate({ ...geoReferencedFloor, refALat: null })).toBe(false)
  })

  it('ジオリファレンス済みならピン配置エディタでも有効にする', () => {
    expect(shouldEnableGeolocate(geoReferencedFloor)).toBe(true)
  })

  it('標準マーカーを抑制し、エリア判定後の独自表示へ切り替える', () => {
    expect(GEOLOCATE_CONTROL_OPTIONS).toEqual({
      trackUserLocation: true,
      showUserLocation: false,
      showAccuracyCircle: false,
    })
    expect(GEOLOCATION_OUTSIDE_MESSAGE)
      .toBe('現在地はこのマップのエリアから離れているようです')
  })
})
