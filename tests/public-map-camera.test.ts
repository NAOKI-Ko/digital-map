import { describe, expect, it } from 'vitest'
import { getCoverViewportCorners, isPointInsideConvexPolygon, isViewportCoveredByPolygon } from '../app/utils/public-map-camera'

describe('public IMAGE map cover geometry', () => {
  const viewport = { width: 390, height: 844 }

  it('投影された画像四角形がviewport四隅を含むときだけcoverとする', () => {
    const covering = [{ x: -200, y: -100 }, { x: 600, y: -100 }, { x: 600, y: 950 }, { x: -200, y: 950 }]
    const fitWithBands = [{ x: 0, y: 200 }, { x: 390, y: 200 }, { x: 390, y: 644 }, { x: 0, y: 644 }]
    expect(isViewportCoveredByPolygon(covering, viewport.width, viewport.height)).toBe(true)
    expect(isViewportCoveredByPolygon(fitWithBands, viewport.width, viewport.height)).toBe(false)
  })

  it('回転した凸四角形でも外接矩形ではなくpolygon内包を判定する', () => {
    const diamond = [{ x: 195, y: -300 }, { x: 550, y: 422 }, { x: 195, y: 1144 }, { x: -160, y: 422 }]
    expect(isPointInsideConvexPolygon({ x: 195, y: 422 }, diamond)).toBe(true)
    expect(isViewportCoveredByPolygon(diamond, viewport.width, viewport.height)).toBe(false)
  })

  it('100lvh基準の仮想viewportを現在canvas中央へ置く', () => {
    expect(getCoverViewportCorners(390, 700, 844)).toEqual([
      { x: 0, y: -72 }, { x: 390, y: -72 }, { x: 390, y: 772 }, { x: 0, y: 772 },
    ])
  })
})
