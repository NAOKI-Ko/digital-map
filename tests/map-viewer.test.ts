import { describe, expect, it, vi } from 'vitest'
import {
  ABSOLUTE_ZOOM_LIMITS,
  addMarkerAtPosition,
  createFloorZoomConstraints,
  createMapViewerStyle,
  createMapViewerOptions,
  createSpotMarkerOptions,
  constrainImagePlacementCandidate,
  GEOLOCATE_CONTROL_OPTIONS,
  GEOLOCATION_OUTSIDE_MESSAGE,
  getFloorLayerIds,
  getImagePlacementCandidate,
  getMapViewerCameraState,
  restoreMapViewerCamera,
  setFlatImageSourceWarp,
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
  categories: [{ id: 'category-1', name: '温泉', order: 0 }],
  importance: 'normal',
  x: 0.5,
  y: 0.5,
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
  refAImageX: 0,
  refAImageY: 0,
  refALat: 35.7,
  refALng: 139.7,
  refBImageX: 1,
  refBImageY: 0,
  refBLat: 35.7,
  refBLng: 139.71,
}

describe('MapViewerのカメラ制約', () => {
  it('PIN編集workspaceは実地図sourceを持たずイラスト専用背景にする', () => {
    const style = createMapViewerStyle('edit')
    expect(style.sources).toEqual({})
    expect(JSON.stringify(style)).not.toContain('openstreetmap')
  })

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
      doubleClickZoom: false,
    })
    expect(VIEWER_CAMERA_CONSTRAINTS.view.maxPitch).toBe(70)
  })

  it('double click zoomを無効化し、明示ボタンとtouch gestureを維持する', () => {
    const options = createMapViewerOptions('map', 'view')
    expect(options.doubleClickZoom).toBe(false)
    expect(options.touchPitch).toBe(true)
    expect(createMapViewerOptions('map', 'edit').doubleClickZoom).toBe(false)
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

describe('画像ソースとPIN座標の描画方式', () => {
  it('MapLibre画像ソースをcanonical PIN座標と同じflat warpへ固定する', () => {
    const setWarp = vi.fn()
    const instance = {
      getSource: vi.fn(() => ({ setWarp })),
    } as unknown as MapLibreMap

    setFlatImageSourceWarp(instance, 'floor-floor-1')

    expect(instance.getSource).toHaveBeenCalledWith('floor-floor-1')
    expect(setWarp).toHaveBeenCalledWith('flat')
  })

  it('古いMapLibre互換ソースでも安全に何もしない', () => {
    const instance = {
      getSource: vi.fn(() => ({})),
    } as unknown as MapLibreMap

    expect(() => setFlatImageSourceWarp(instance, 'floor-floor-1')).not.toThrow()
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
  it('汎用の既定プリセットと保存色を反映する', () => {
    expect(getSpotMarkerPresentation(baseSpot)).toEqual({
      type: 'preset',
      color: '#C7401F',
      lightColor: '#DD8C79',
      darkColor: '#772613',
      imageUrl: null,
      iconFamily: 'kanji',
      symbol: '●',
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

  it.each(['view', 'edit'] as const)('保存済みMarkerは%sモードでbottom-centerを接地点にする', (mode) => {
    const element = {} as HTMLElement
    expect(createSpotMarkerOptions(element, mode)).toEqual({
      element,
      anchor: 'bottom',
      draggable: mode === 'edit',
      subpixelPositioning: true,
    })
  })

  it('再設定対象以外のMarkerはeditモードでもdrag不可にできる', () => {
    expect(createSpotMarkerOptions({} as HTMLElement, 'edit', false).draggable).toBe(false)
    expect(createSpotMarkerOptions({} as HTMLElement, 'edit', true).draggable).toBe(true)
  })

})

describe('IMAGE placement interaction', () => {
  it('illustration外のmap clickをcandidateにしない', () => {
    expect(getImagePlacementCandidate(geoReferencedFloor, { lat: 35.7, lng: 139.711 })).toBeNull()
  })

  it('illustration外へdragしたcandidateを境界内へ制約する', () => {
    const candidate = constrainImagePlacementCandidate(geoReferencedFloor, { lat: 35.7, lng: 139.711 })
    expect(candidate?.x).toBe(1)
    expect(candidate?.y).toBeCloseTo(0, 10)
  })
})

describe('editor camera context', () => {
  it('現在cameraを緯度経度とzoomだけに正規化する', () => {
    const instance = {
      getCenter: () => ({ lat: 35.1, lng: 139.2 }),
      getZoom: () => 16.5,
    } as MapLibreMap

    expect(getMapViewerCameraState(instance)).toEqual({
      center: { lat: 35.1, lng: 139.2 },
      zoom: 16.5,
    })
  })

  it('復帰cameraへcenterとzoomだけを適用する', () => {
    const jumpTo = vi.fn()
    restoreMapViewerCamera({ jumpTo } as unknown as MapLibreMap, {
      center: { lat: 35.1, lng: 139.2 },
      zoom: 16.5,
    })

    expect(jumpTo).toHaveBeenCalledWith({ center: [139.2, 35.1], zoom: 16.5 })
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
