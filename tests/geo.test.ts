import { describe, expect, it } from 'vitest'
import {
  AREA_MARGIN_METERS,
  computeFloorCorners,
  computeFallbackCorners,
  getFloorCorners,
  getGeoReferenceBounds,
  getGeoReferenceValidationError,
  imageToRenderCoordinates,
  isGeoReferenced,
  isValidImagePosition,
  isWithinFloorArea,
  renderToImageCoordinates,
  REFERENCE_DISTANCE_ERROR,
  toImageCoordinates,
  type CompleteFloorGeoReference,
  type FloorGeoReferenceFields,
  type FloorCorners,
} from '../lib/geo'

const baseFloor: CompleteFloorGeoReference = {
  imageWidth: 1000,
  imageHeight: 500,
  refAImageX: 0,
  refAImageY: 0,
  refALat: 35,
  refALng: 139,
  refBImageX: 1,
  refBImageY: 0,
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
      refBImageY: 1,
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
    const corners = computeFloorCorners(floor({ refBImageX: 0.05, refBLng: 140 }))

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
    ['ピクセル距離が50未満', { refBImageX: 0.049 }],
    ['実距離が20m未満', { refBImageX: 0.1, refBLat: 35 + 10 / 111_319.490_793_273_57, refBLng: 139 }],
  ])('%sならエラーにする', (_label, overrides) => {
    expect(() => computeFloorCorners(floor(overrides))).toThrow(REFERENCE_DISTANCE_ERROR)
  })

  it('基準点AとBが完全に同一ならエラーにする', () => {
    expect(() => computeFloorCorners(floor({
      refBImageX: 0,
      refBImageY: 0,
      refBLat: 35,
      refBLng: 139,
    }))).toThrow(REFERENCE_DISTANCE_ERROR)
  })
})

describe('normalized IMAGE placement transform', () => {
  it.each([
    ['top-left', { x: 0, y: 0 }],
    ['center', { x: 0.5, y: 0.5 }],
    ['bottom-right', { x: 1, y: 1 }],
  ])('%sをgeoreference座標へ変換して誤差なく逆変換する', (_label, imagePosition) => {
    const rendered = imageToRenderCoordinates(baseFloor, imagePosition)
    expect(rendered).not.toBeNull()
    const restored = renderToImageCoordinates(baseFloor, rendered!)
    expect(restored?.x).toBeCloseTo(imagePosition.x, 11)
    expect(restored?.y).toBeCloseTo(imagePosition.y, 11)
  })

  it('fallback表示でもIMAGE座標を往復する', () => {
    const fallbackFloor = {
      ...baseFloor,
      refAImageX: null,
      refAImageY: null,
      refALat: null,
      refALng: null,
      refBImageX: null,
      refBImageY: null,
      refBLat: null,
      refBLng: null,
    }
    const rendered = imageToRenderCoordinates(fallbackFloor, { x: 0.2, y: 0.8 })
    const restored = renderToImageCoordinates(fallbackFloor, rendered!)
    expect(restored?.x).toBeCloseTo(0.2, 10)
    expect(restored?.y).toBeCloseTo(0.8, 10)
  })

  it('Web Mercator描画平面で補間し、zoom後も画像とPINの基準点を一致させる', () => {
    const highLatitudeFloor = floor({ refALat: 70, refBLat: 70, refBLng: 139.4, imageHeight: 1000 })
    const corners = getFloorCorners(highLatitudeFloor)!
    const rendered = imageToRenderCoordinates(highLatitudeFloor, { x: 0.5, y: 0.5 })!
    const mercatorY = (lat: number) => {
      const sin = Math.sin(lat * Math.PI / 180)
      return 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)
    }
    const expectedProjectedY = Object.values(corners).reduce((sum, corner) => sum + mercatorY(corner.lat), 0) / 4
    expect(mercatorY(rendered.lat)).toBeCloseTo(expectedProjectedY, 12)
  })

  it('partial/out-of-range IMAGE positionをinvalidとする', () => {
    expect(isValidImagePosition({ x: 0, y: 1 })).toBe(true)
    expect(isValidImagePosition({ x: -0.0001, y: 0.5 })).toBe(false)
    expect(isValidImagePosition({ x: 0.5, y: 1.0001 })).toBe(false)
  })

  it('georeference変更はcanonical x/yを変更しない', () => {
    const canonical = Object.freeze({ x: 0.3, y: 0.7 })
    const before = imageToRenderCoordinates(baseFloor, canonical)
    const after = imageToRenderCoordinates({ ...baseFloor, refBLng: 139.02 }, canonical)
    expect(after).not.toEqual(before)
    expect(canonical).toEqual({ x: 0.3, y: 0.7 })
  })
})

describe('computeFallbackCorners', () => {
  it.each([
    ['横長', 2000, 1000, 0.01, 0.005],
    ['縦長', 1000, 2000, 0.005, 0.01],
    ['正方形', 1000, 1000, 0.01, 0.01],
  ])('%s画像の縦横比を保った範囲を返す', (_label, width, height, expectedLngSpan, expectedLatSpan) => {
    const corners = computeFallbackCorners(width, height)
    const lngSpan = corners.topRight.lng - corners.topLeft.lng
    const latSpan = corners.topLeft.lat - corners.bottomLeft.lat

    expect(lngSpan).toBeCloseTo(expectedLngSpan, 10)
    expect(latSpan).toBeCloseTo(expectedLatSpan, 10)
    expect(lngSpan / latSpan).toBeCloseTo(width / height, 10)
    expect(corners.topLeft).toEqual({ lat: expectedLatSpan / 2, lng: -expectedLngSpan / 2 })
    expect(corners.bottomRight).toEqual({ lat: -expectedLatSpan / 2, lng: expectedLngSpan / 2 })
  })

  it.each([
    [0, 1000],
    [1000, 0],
    [Number.NaN, 1000],
  ])('不正な画像寸法(%s × %s)を拒否する', (width, height) => {
    expect(() => computeFallbackCorners(width, height))
      .toThrow('画像の幅と高さを確認してください。')
  })
})

describe('isGeoReferenced', () => {
  it('基準点A・Bの8項目がすべて有限数ならtrueを返す', () => {
    expect(isGeoReferenced(baseFloor)).toBe(true)
  })

  it.each([
    'refAImageX',
    'refAImageY',
    'refALat',
    'refALng',
    'refBImageX',
    'refBImageY',
    'refBLat',
    'refBLng',
  ] satisfies Array<keyof FloorGeoReferenceFields>)('%sだけ未設定でもfalseを返す', (field) => {
    expect(isGeoReferenced({ ...baseFloor, [field]: null })).toBe(false)
  })

  it('基準点に非有限値があればfalseを返す', () => {
    expect(isGeoReferenced({ ...baseFloor, refBLng: Number.NaN })).toBe(false)
  })

  it('画像寸法は現在地機能の設定有無判定に含めない', () => {
    expect(isGeoReferenced({ ...baseFloor, imageWidth: null, imageHeight: null })).toBe(true)
  })
})

describe('isWithinFloorArea', () => {
  const corners: FloorCorners = {
    topLeft: { lat: 35.001, lng: 138.999 },
    topRight: { lat: 35.001, lng: 139.001 },
    bottomRight: { lat: 34.999, lng: 139.001 },
    bottomLeft: { lat: 34.999, lng: 138.999 },
  }

  it('フロア範囲の内側をtrueにする', () => {
    expect(isWithinFloorArea(35, 139, corners)).toBe(true)
  })

  it('フロア外でも既定の300mマージン内ならtrueにする', () => {
    expect(AREA_MARGIN_METERS).toBe(300)
    expect(isWithinFloorArea(35.003, 139, corners)).toBe(true)
  })

  it('フロア範囲とマージンから離れた位置をfalseにする', () => {
    expect(isWithinFloorArea(35.006, 139, corners)).toBe(false)
  })

  it('指定したマージン値を判定へ反映する', () => {
    expect(isWithinFloorArea(35.0015, 139, corners, 0)).toBe(false)
    expect(isWithinFloorArea(35.0015, 139, corners, 100)).toBe(true)
  })
})

describe('ジオリファレンス設定有無による4隅振り分け', () => {
  it('基準点がすべて設定済みなら2点合わせの結果を返す', () => {
    expect(getFloorCorners(baseFloor))
      .toEqual(computeFloorCorners(baseFloor))
  })

  it('基準点が一部未設定なら画像寸法から自動算出する', () => {
    expect(getFloorCorners({ ...baseFloor, refBLng: null }))
      .toEqual(computeFallbackCorners(baseFloor.imageWidth, baseFloor.imageHeight))
  })

  it('基準点がすべて未設定でも画像寸法から自動算出する', () => {
    expect(getFloorCorners({
      ...baseFloor,
      refAImageX: null,
      refAImageY: null,
      refALat: null,
      refALng: null,
      refBImageX: null,
      refBImageY: null,
      refBLat: null,
      refBLng: null,
    })).toEqual(computeFallbackCorners(baseFloor.imageWidth, baseFloor.imageHeight))
  })

  it('未設定かつ画像寸法が不正ならnullを返す', () => {
    expect(getFloorCorners({
      ...baseFloor,
      refAImageX: null,
      refAImageY: null,
      refALat: null,
      refALng: null,
      refBImageX: null,
      refBImageY: null,
      refBLat: null,
      refBLng: null,
      imageWidth: 0,
      imageHeight: 0,
    })).toBeNull()
  })
})

describe('2点合わせのバリデーションとMapLibre変換', () => {
  it('画像外のピクセル座標を拒否する', () => {
    expect(getGeoReferenceValidationError(floor({ refBImageX: 1.001 })))
      .toBe('イラスト上の基準点を画像の内側で選んでください。')
  })

  it('値が1つでもnullなら未設定として扱う', () => {
    expect(getFloorCorners({ ...baseFloor, refBLng: null }))
      .toEqual(computeFallbackCorners(baseFloor.imageWidth, baseFloor.imageHeight))
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
