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
  spotCategories: [{ category: { id: 'category-1', name: '観光', order: 0, translations: [] } }],
  description: null,
  address: null,
  website: null,
  x: 0.5,
  y: 0.5,
  photosJson: [],
  hoursText: null,
  holidayText: null,
  phone: null,
  fieldValues: [],
  translations: [],
  fieldValueTranslations: [],
  pinIconType: 'preset',
  pinIconId: 'sightseeing',
  pinIconImageUrl: null,
  pinColor: '#C7401F',
  isPublished: true,
} satisfies PublicMapRecord['floors'][number]['spots'][number]

function mapRecord(overrides: {
  isPublished?: boolean
  defaultLocale?: string
  enabledLocales?: string[]
  spots?: PublicMapRecord['floors'][number]['spots']
  spotFieldDefinitions?: PublicMapRecord['spotFieldDefinitions']
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
    defaultLocale: overrides.defaultLocale ?? 'ja',
    enabledLocales: overrides.enabledLocales ?? ['ja'],
    translations: [],
    spotFieldDefinitions: overrides.spotFieldDefinitions ?? [],
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
      decorations: [],
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

  it('公開設定済みの項目だけを定義順で返し、内部・無効・空値を漏らさない', async () => {
    mocks.findFirst.mockResolvedValue(mapRecord({
      spotFieldDefinitions: [
        { id: 'description', semanticKey: 'description', label: '紹介', type: 'multiline_text', order: 0, translations: [] },
        { id: 'address', semanticKey: 'address', label: '所在地', type: 'single_line_text', order: 1, translations: [] },
        { id: 'custom-public', semanticKey: null, label: '席数', type: 'number', order: 2, translations: [] },
        { id: 'website', semanticKey: 'website', label: '公式サイト', type: 'url', order: 3, translations: [] },
      ],
      spots: [{
        ...publishedSpot,
        description: '公開紹介',
        address: '',
        website: 'https://example.com',
        fieldValues: [
          { fieldDefinitionId: 'custom-public', valueJson: 0 },
          { fieldDefinitionId: 'internal-field', valueJson: '秘密' },
          { fieldDefinitionId: 'disabled-field', valueJson: '退避値' },
        ],
      }],
    }))

    const spot = (await getPublicMapBySlug('test-map'))?.floors[0]?.spots[0]
    expect(spot).toMatchObject({
      description: '公開紹介',
      informationFields: [{ id: 'custom-public', label: '席数', value: '0', href: null }],
      websiteAction: { label: '公式サイト', url: 'https://example.com' },
    })
    expect(JSON.stringify(spot)).not.toContain('秘密')
    expect(JSON.stringify(spot)).not.toContain('退避値')
    expect(spot?.informationFields).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: 'address' })]))
  })

  it('説明定義が内部設定なら説明本文を返さない', async () => {
    mocks.findFirst.mockResolvedValue(mapRecord({
      spotFieldDefinitions: [],
      spots: [{ ...publishedSpot, description: '内部紹介' }],
    }))
    expect((await getPublicMapBySlug('test-map'))?.floors[0]?.spots[0]?.description).toBeNull()
  })

  it('Mapで有効なlocaleのField labelを返し、空なら既定labelへfallbackする', async () => {
    const definitions = [
      { id: 'custom-public', semanticKey: null, label: '席数', type: 'number', order: 0, translations: [{ locale: 'zh-CN', label: '座位数' }, { locale: 'ko', label: '' }] },
      { id: 'website', semanticKey: 'website', label: '公式サイト', type: 'url', order: 1, translations: [{ locale: 'zh-CN', label: '官方网站' }] },
    ] satisfies PublicMapRecord['spotFieldDefinitions']
    mocks.findFirst.mockResolvedValue(mapRecord({
      enabledLocales: ['ja', 'zh-CN', 'ko'],
      spotFieldDefinitions: definitions,
      spots: [{ ...publishedSpot, website: 'https://example.com', fieldValues: [{ fieldDefinitionId: 'custom-public', valueJson: 4 }] }],
    }))

    const chinese = await getPublicMapBySlug('test-map', 'zh-CN')
    expect(chinese?.floors[0]?.spots[0]).toMatchObject({
      informationFields: [{ label: '座位数' }],
      websiteAction: { label: '官方网站' },
    })

    mocks.findFirst.mockResolvedValue(mapRecord({
      enabledLocales: ['ja', 'zh-CN', 'ko'],
      spotFieldDefinitions: definitions,
      spots: [{ ...publishedSpot, website: 'https://example.com', fieldValues: [{ fieldDefinitionId: 'custom-public', valueJson: 4 }] }],
    }))
    const korean = await getPublicMapBySlug('test-map', 'ko')
    expect(korean?.floors[0]?.spots[0]).toMatchObject({
      informationFields: [{ label: '席数' }],
      websiteAction: { label: '公式サイト' },
    })
  })
})
