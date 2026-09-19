import { afterAll, describe, expect, it, vi } from 'vitest'
import { collectSpotCategories, filterSpotsByCategoryIds } from '../app/utils/category-filter'
import { categoryCreateSchema, categoryUpdateSchema } from '../shared/schemas/category'
import type { MapViewerSpot } from '../shared/types/map-viewer'

vi.stubGlobal('createError', (input: { statusCode: number, statusMessage: string }) => Object.assign(new Error(input.statusMessage), input))

const spots = [
  { id: 'spot-1', categories: [{ id: 'c2', name: '買い物', order: 2 }, { id: 'c1', name: '観光', order: 1 }] },
  { id: 'spot-2', categories: [{ id: 'c3', name: '飲食', order: 0 }] },
  { id: 'spot-3', categories: [] },
] as MapViewerSpot[]

describe('Category validation', () => {
  it('名称をtrimしorderを検証する', () => {
    expect(categoryCreateSchema.parse({ name: '  観光  ', order: 2 })).toEqual({ name: '観光', order: 2 })
    expect(categoryCreateSchema.safeParse({ name: '   ' }).success).toBe(false)
    expect(categoryCreateSchema.safeParse({ name: '観光', order: -1 }).success).toBe(false)
  })

  it('50文字を許可し、51文字以上を拒否する', () => {
    expect(categoryCreateSchema.safeParse({ name: 'あ'.repeat(50) }).success).toBe(true)
    expect(categoryCreateSchema.safeParse({ name: 'あ'.repeat(51) }).success).toBe(false)
  })

  it('PATCHはname/orderのどちらかを必須にする', () => {
    expect(categoryUpdateSchema.safeParse({}).success).toBe(false)
    expect(categoryUpdateSchema.safeParse({ order: 0 }).success).toBe(true)
  })
})

describe('Category relation validation', () => {
  it('IDをdedupeしMap内Categoryを一括取得する', async () => {
    const findMany = vi.fn().mockResolvedValue([
      { id: 'c2', name: '買い物', order: 2 },
      { id: 'c1', name: '観光', order: 1 },
    ])
    const { validateSpotCategories } = await import('../server/utils/category')
    const result = await validateSpotCategories({ category: { findMany } } as never, 'map-1', 'tenant-1', ['c1', 'c2', 'c1'])
    expect(findMany).toHaveBeenCalledOnce()
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: { in: ['c1', 'c2'] }, mapId: 'map-1', tenantId: 'tenant-1' } }))
    expect(result).toHaveLength(2)
  })

  it('存在しない／他MapのCategoryを同じ422で拒否する', async () => {
    const { validateSpotCategories } = await import('../server/utils/category')
    const client = { category: { findMany: vi.fn().mockResolvedValue([]) } } as never
    await expect(validateSpotCategories(client, 'map-1', 'tenant-1', ['other-map-category'])).rejects.toMatchObject({ statusCode: 422 })
  })
})

describe('公開Category OR filter', () => {
  it('候補を重複排除してorder順に返す', () => {
    expect(collectSpotCategories(spots).map(category => category.id)).toEqual(['c3', 'c1', 'c2'])
  })

  it('未選択では0 Category Spotも表示し、複数選択ではOR一致だけを返す', () => {
    expect(filterSpotsByCategoryIds(spots, []).map(spot => spot.id)).toEqual(['spot-1', 'spot-2', 'spot-3'])
    expect(filterSpotsByCategoryIds(spots, ['c1', 'c3']).map(spot => spot.id)).toEqual(['spot-1', 'spot-2'])
  })

  it('カフェ／土産の単独・複数選択をOR semanticsで処理する', () => {
    const matrix = [
      { id: 'a', categories: [{ id: 'cafe', name: 'カフェ', order: 0 }] },
      { id: 'b', categories: [{ id: 'gift', name: '土産', order: 1 }] },
      { id: 'c', categories: [{ id: 'cafe', name: 'カフェ', order: 0 }, { id: 'gift', name: '土産', order: 1 }] },
      { id: 'd', categories: [] },
    ] as MapViewerSpot[]
    expect(filterSpotsByCategoryIds(matrix, []).map(spot => spot.id)).toEqual(['a', 'b', 'c', 'd'])
    expect(filterSpotsByCategoryIds(matrix, ['cafe']).map(spot => spot.id)).toEqual(['a', 'c'])
    expect(filterSpotsByCategoryIds(matrix, ['gift']).map(spot => spot.id)).toEqual(['b', 'c'])
    expect(filterSpotsByCategoryIds(matrix, ['cafe', 'gift']).map(spot => spot.id)).toEqual(['a', 'b', 'c'])
  })
})

afterAll(() => vi.unstubAllGlobals())
