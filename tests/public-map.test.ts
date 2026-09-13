import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
}))

vi.mock('../server/utils/prisma', () => ({
  prisma: { map: { findFirst: mocks.findFirst } },
}))

import { getPublicMapBySlug, type PublicMapRecord } from '../server/utils/public-map'

const publishedSpot = {
  id: 'spot-published',
  floorId: 'floor-1',
  name: '公開スポット',
  importance: 'normal',
  spotCategories: [{ category: { id: 'category-1', name: '観光', order: 0 } }],
  description: null,
  x: 0.5,
  y: 0.5,
  photosJson: [],
  hoursText: null,
  holidayText: null,
  phone: null,
  pinIconType: 'preset',
  pinIconId: 'sightseeing',
  pinIconImageUrl: null,
  pinColor: '#C7401F',
  isPublished: true,
} satisfies PublicMapRecord['floors'][number]['spots'][number]

function mapRecord(overrides: {
  isPublished?: boolean
  spots?: PublicMapRecord['floors'][number]['spots']
} = {}): PublicMapRecord {
  return {
    id: 'map-1',
    name: 'テストマップ',
    slug: 'test-map',
    organizationName: null,
    logoUrl: null,
    websiteUrl: null,
    snsUrl: null,
    isPublished: overrides.isPublished ?? true,
    floors: [{
      id: 'floor-1',
      name: '1階',
      illustrationUrl: '/uploads/floor.png',
      imageWidth: 0,
      imageHeight: 0,
      order: 0,
      refAImageX: null,
      refAImageY: null,
      refALat: null,
      refALng: null,
      refBImageX: null,
      refBImageY: null,
      refBLat: null,
      refBLng: null,
      spots: overrides.spots ?? [publishedSpot],
    }],
  }
}

describe('GET /api/public/:mapSlug', () => {
  beforeEach(() => mocks.findFirst.mockReset())

  it('DBクエリで公開マップかつ公開・座標設定済みスポットだけを取得する', async () => {
    mocks.findFirst.mockResolvedValue(mapRecord())

    await getPublicMapBySlug('test-map')

    expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { slug: 'test-map', isPublished: true },
      select: expect.objectContaining({
        floors: expect.objectContaining({
          select: expect.objectContaining({
            spots: expect.objectContaining({
              where: {
                isPublished: true,
                x: { not: null },
                y: { not: null },
              },
            }),
          }),
        }),
      }),
    }))
  })

  it('マップが非公開ならスポットが公開でも返さない', async () => {
    mocks.findFirst.mockResolvedValue(mapRecord({ isPublished: false }))
    await expect(getPublicMapBySlug('test-map')).resolves.toBeNull()
  })

  it('マップが公開でも非公開スポットを返さない', async () => {
    mocks.findFirst.mockResolvedValue(mapRecord({
      spots: [{ ...publishedSpot, id: 'spot-draft', isPublished: false }],
    }))

    const result = await getPublicMapBySlug('test-map')
    expect(result?.floors[0]?.spots).toEqual([])
  })

  it('マップとスポットが両方公開の場合だけスポットを返す', async () => {
    mocks.findFirst.mockResolvedValue(mapRecord())

    const result = await getPublicMapBySlug('test-map')
    expect(result?.floors[0]?.spots).toEqual([expect.objectContaining({ id: 'spot-published' })])
  })

  it('公開フラグが揃っていても座標未設定スポットを返さない', async () => {
    mocks.findFirst.mockResolvedValue(mapRecord({
      spots: [{ ...publishedSpot, x: null, y: null }],
    }))

    const result = await getPublicMapBySlug('test-map')
    expect(result?.floors[0]?.spots).toEqual([])
  })

  it('公開responseはCategory・importance・brandingを返し、admin用公開フラグを混ぜない', async () => {
    mocks.findFirst.mockResolvedValue(mapRecord())

    const result = await getPublicMapBySlug('test-map')
    expect(result).toMatchObject({
      organizationName: null,
      logoUrl: null,
      websiteUrl: null,
      snsUrl: null,
      floors: [{ spots: [{ importance: 'normal', categories: [{ id: 'category-1', name: '観光', order: 0 }] }] }],
    })
    expect(result).not.toHaveProperty('isPublished')
    expect(result?.floors[0]?.spots[0]).not.toHaveProperty('isPublished')
    expect(result?.floors[0]?.spots[0]).not.toHaveProperty('spotCategories')
  })
})
