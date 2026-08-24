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
    expect(spotFormSchema.parse({ ...baseSpot, lat: null, lng: null })).toMatchObject({ lat: null, lng: null, categoryIds: [] })
  })

  it('後から有効な緯度経度を設定できる', () => {
    expect(spotPositionSchema.parse({ lat: 35.1, lng: 139.2 })).toEqual({ lat: 35.1, lng: 139.2 })
  })

  it('片方だけの座標は作成時に拒否する', () => {
    expect(spotFormSchema.safeParse({ ...baseSpot, lat: 35.1, lng: null }).success).toBe(false)
  })
})
