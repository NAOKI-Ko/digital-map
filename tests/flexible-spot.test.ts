import { describe, expect, it } from 'vitest'
import { spotFormSchema } from '../shared/schemas/spot'
import { spotPositionSchema } from '../shared/schemas/position'

const baseSpot = {
  floorId: 'floor-1',
  name: '未配置スポット',
  categoryIds: [],
  description: '',
  hoursText: '',
  holidayText: '',
  phone: '',
}

describe('未配置Spot lifecycle', () => {
  it('位置なし・CategoryなしでSpot情報を先に作成できる', () => {
    expect(spotFormSchema.parse({ ...baseSpot, x: null, y: null })).toMatchObject({ x: null, y: null, categoryIds: [], importance: 'normal' })
  })

  it('後から有効なIMAGE座標を設定できる', () => {
    expect(spotPositionSchema.parse({ x: 0.25, y: 0.75 })).toEqual({ x: 0.25, y: 0.75 })
  })

  it('片方だけの座標は作成時に拒否する', () => {
    expect(spotFormSchema.safeParse({ ...baseSpot, x: 0.25, y: null }).success).toBe(false)
  })

  it('通常・注目の2段階だけを重要度として受け付ける', () => {
    expect(spotFormSchema.safeParse({ ...baseSpot, importance: 'featured', x: null, y: null }).success).toBe(true)
    expect(spotFormSchema.safeParse({ ...baseSpot, importance: 'critical', x: null, y: null }).success).toBe(false)
  })

  it('実座標はnull/nullまたは有効範囲の有限な組だけを受け付ける', () => {
    expect(spotFormSchema.safeParse({ ...baseSpot, x: null, y: null, lat: null, lng: null }).success).toBe(true)
    expect(spotFormSchema.safeParse({ ...baseSpot, x: null, y: null, lat: -90, lng: 180 }).success).toBe(true)
    expect(spotFormSchema.safeParse({ ...baseSpot, x: null, y: null, lat: 90, lng: -180 }).success).toBe(true)
    expect(spotFormSchema.safeParse({ ...baseSpot, x: null, y: null, lat: 35, lng: null }).success).toBe(false)
    expect(spotFormSchema.safeParse({ ...baseSpot, x: null, y: null, lat: null, lng: 136 }).success).toBe(false)
    expect(spotFormSchema.safeParse({ ...baseSpot, x: null, y: null, lat: 91, lng: 136 }).success).toBe(false)
    expect(spotFormSchema.safeParse({ ...baseSpot, x: null, y: null, lat: 35, lng: 181 }).success).toBe(false)
    expect(spotFormSchema.safeParse({ ...baseSpot, x: null, y: null, lat: Number.NaN, lng: 136 }).success).toBe(false)
    expect(spotFormSchema.safeParse({ ...baseSpot, x: null, y: null, lat: 35, lng: Number.POSITIVE_INFINITY }).success).toBe(false)
  })

  it('実座標とIllustration x/yを独立して保持する', () => {
    expect(spotFormSchema.parse({ ...baseSpot, x: 0.25, y: 0.75, lat: 35.1, lng: 136.9 })).toMatchObject({
      x: 0.25,
      y: 0.75,
      lat: 35.1,
      lng: 136.9,
    })
  })
})
