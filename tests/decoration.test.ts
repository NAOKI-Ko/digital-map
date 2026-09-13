import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getDecorationImageCorners } from '../lib/decoration'
import { decorationCreateSchema } from '../shared/schemas/decoration'

const floor = { imageWidth: 1000, imageHeight: 500, refAImageX: null, refAImageY: null, refALat: null, refALng: null, refBImageX: null, refBImageY: null, refBLat: null, refBLng: null }
const decoration = { id: 'd1', imageUrl: '/uploads/a.png', imageWidth: 200, imageHeight: 100, x: 0.5, y: 0.5, width: 0.2, rotation: 0, order: 0 }

describe('IMAGE Floor Decoration', () => {
  it('normalized center/widthから画像比率を保つ四隅を作る', () => {
    expect(getDecorationImageCorners(floor, decoration)).toEqual([
      { x: 0.4, y: 0.4 }, { x: 0.6, y: 0.4 }, { x: 0.6, y: 0.6 }, { x: 0.4, y: 0.6 },
    ])
  })

  it('任意pixel位置やlat/lngを受け付けない', () => {
    expect(decorationCreateSchema.safeParse({ assetId: 'a', x: 20, y: 20, width: 100, rotation: 0 }).success).toBe(false)
    expect(decorationCreateSchema.keyof().options).not.toEqual(expect.arrayContaining(['lat', 'lng']))
  })

  it('公開側はDecorationをMapLibre raster layerにし、Spot markerとは別に描画する', () => {
    const source = readFileSync(new URL('../app/composables/useMapViewer.ts', import.meta.url), 'utf8')
    expect(source).toContain("type: 'image', url: decoration.imageUrl")
    expect(source).toContain("type: 'raster', source: sourceId")
    expect(source).toContain('new currentMaplibre.Marker')
  })

  it('インスタンス削除はMediaAssetを削除しない', () => {
    const source = readFileSync(new URL('../server/api/maps/[mapId]/floors/[floorId]/decorations/[decorationId].delete.ts', import.meta.url), 'utf8')
    expect(source).toContain('floorDecoration.deleteMany')
    expect(source).not.toContain('mediaAsset.delete')
  })
})
