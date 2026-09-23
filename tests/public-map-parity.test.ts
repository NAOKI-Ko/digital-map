import { describe, expect, it } from 'vitest'
import { getMinimalSpotPan, needsHeadingReset } from '../app/utils/public-map-exploration'
import { createPublicMapDecorationFixture } from '../app/utils/public-map-decoration-fixture'

const viewport = { width: 390, height: 844 }

describe('地図を見ながら詳細を読むカメラ契約', () => {
  it('選択PINが可視範囲内なら自動パンしない', () => {
    expect(getMinimalSpotPan({ x: 180, y: 200 }, viewport, { left: 0, top: 338 })).toEqual([0, 0])
  })

  it('下部シートに隠れるPINを余白分だけ上げる', () => {
    expect(getMinimalSpotPan({ x: 180, y: 410 }, viewport, { left: 0, top: 338 })).toEqual([0, -116])
  })

  it('デスクトップの側面詳細に隠れるPINを最小限左へ動かす', () => {
    expect(getMinimalSpotPan({ x: 1080, y: 360 }, { width: 1440, height: 800 }, { left: 930, top: 20 })).toEqual([-194, 0])
  })

  it('傾きだけ変更された場合も向きの復帰を出す', () => {
    expect(needsHeadingReset(0, 20, 45)).toBe(true)
    expect(needsHeadingReset(0, 45, 45)).toBe(false)
    expect(needsHeadingReset(2, 45, 45)).toBe(true)
  })
})

describe('隔離した装飾fixture', () => {
  it('ground・木・画像端の建物・透明余白の四種類を公開データと別に保持する', () => {
    const fixture = createPublicMapDecorationFixture()
    expect(fixture.map(item => item.id)).toEqual(['qa-ground', 'qa-tree', 'qa-building-edge', 'qa-padded-tree'])
    expect(fixture.every(item => item.imageUrl.startsWith('/__qa__/public-map-decorations/'))).toBe(true)
    expect(fixture.find(item => item.id === 'qa-building-edge')?.x).toBeGreaterThan(0.9)
    expect(fixture.find(item => item.id === 'qa-ground')?.rotation).not.toBe(0)
  })
})
