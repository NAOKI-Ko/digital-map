import { readFileSync } from 'node:fs'
import { afterAll, describe, expect, it, vi } from 'vitest'
import { categoryCreateSchema, categoryUpdateSchema } from '../shared/schemas/category'
import { filterSpotsByCategoryIds } from '../app/utils/category-filter'
import type { MapViewerSpot } from '../shared/types/map-viewer'

vi.stubGlobal('createError', (input: { statusCode: number, statusMessage: string }) => Object.assign(new Error(input.statusMessage), input))

const customUrl = '/uploads/category-icon-map-a--12345678-1234-4123-8123-123456789abc.png'

describe('Category icon validation', () => {
  it('既存Categoryとiconなしを許可する', () => {
    expect(categoryCreateSchema.safeParse({ name: '観光' }).success).toBe(true)
    expect(categoryCreateSchema.safeParse({ name: '観光', iconType: null, iconPresetId: null, iconImageUrl: null }).success).toBe(true)
  })

  it('presetとcustomを作成・更新できる', () => {
    expect(categoryCreateSchema.safeParse({ name: '飲食', iconType: 'preset', iconPresetId: 'material:restaurant', iconImageUrl: null }).success).toBe(true)
    expect(categoryCreateSchema.safeParse({ name: '買い物', iconType: 'custom', iconPresetId: null, iconImageUrl: customUrl }).success).toBe(true)
    expect(categoryUpdateSchema.safeParse({ iconType: null, iconPresetId: null, iconImageUrl: null }).success).toBe(true)
  })

  it.each([
    { iconType: 'preset', iconPresetId: 'material:not_supported', iconImageUrl: null },
    { iconType: 'preset', iconPresetId: 'x'.repeat(101), iconImageUrl: null },
    { iconType: 'preset', iconPresetId: 'material:restaurant', iconImageUrl: customUrl },
    { iconType: 'custom', iconPresetId: 'material:restaurant', iconImageUrl: customUrl },
    { iconType: 'custom', iconPresetId: null, iconImageUrl: 'https://example.com/icon.png' },
    { iconType: 'custom', iconPresetId: null, iconImageUrl: 'javascript:alert(1)' },
    { iconType: 'custom', iconPresetId: null, iconImageUrl: 'data:image/png;base64,abc' },
    { iconType: 'custom', iconPresetId: null, iconImageUrl: '/uploads/category-icon-map-a--../icon.png' },
    { iconType: 'custom', iconPresetId: null, iconImageUrl: '/uploads/category-icon-map-a--not-a-uuid.png' },
  ])('矛盾・不明preset・危険な画像pathを拒否する', (icon) => {
    expect(categoryCreateSchema.safeParse({ name: '不正', ...icon }).success).toBe(false)
  })

  it('他Mapの画像関連付けを拒否する', async () => {
    const { toCategoryIconData } = await import('../server/utils/category-icon')
    expect(() => toCategoryIconData({ iconType: 'custom', iconPresetId: null, iconImageUrl: customUrl }, 'map-b')).toThrow()
    expect(toCategoryIconData({ iconType: 'custom', iconPresetId: null, iconImageUrl: customUrl }, 'map-a')).toEqual({ iconType: 'custom', iconPresetId: null, iconImageUrl: customUrl })
  })
})

describe('Category icon domain and public UI', () => {
  it('icon更新dataはSpot relation・PIN・座標を含まない', async () => {
    const { toCategoryIconData } = await import('../server/utils/category-icon')
    const data = toCategoryIconData({ iconType: 'preset', iconPresetId: 'material:park', iconImageUrl: null }, 'map-a')
    expect(data).toEqual({ iconType: 'preset', iconPresetId: 'material:park', iconImageUrl: null })
    expect(data).not.toHaveProperty('spotCategories')
    expect(data).not.toHaveProperty('pinIconType')
    expect(data).not.toHaveProperty('lat')
    expect(data).not.toHaveProperty('lng')
  })

  it('icon情報が増えても公開filterのOR semanticsを維持する', () => {
    const spots = [
      { id: 'a', categories: [{ id: 'c1', name: '飲食', order: 0, iconType: 'preset', iconPresetId: 'material:restaurant', iconImageUrl: null }] },
      { id: 'b', categories: [{ id: 'c2', name: '観光', order: 1, iconType: 'custom', iconPresetId: null, iconImageUrl: customUrl }] },
      { id: 'c', categories: [] },
    ] as MapViewerSpot[]
    expect(filterSpotsByCategoryIds(spots, ['c1', 'c2']).map(spot => spot.id)).toEqual(['a', 'b'])
  })

  it('Spot selector・公開visible/overflowで共通icon表示を使う', () => {
    const spotForm = readFileSync(new URL('../app/components/admin/SpotForm.vue', import.meta.url), 'utf8')
    const filter = readFileSync(new URL('../app/components/map/CategoryFilter.vue', import.meta.url), 'utf8')
    expect(spotForm).toContain('<CategoryIcon')
    expect(filter.match(/<CategoryIcon/g)).toHaveLength(3)
    expect(filter).toContain(':aria-pressed="modelValue.includes(category.id)"')
  })
})

describe('Category icon migration', () => {
  const migration = readFileSync(new URL('../prisma/migrations/20260825000000_add_category_icon/migration.sql', import.meta.url), 'utf8')
  it('nullable列だけを追加し既存Category・relationへ触れない', () => {
    expect(migration).toContain('ADD COLUMN "iconType" TEXT')
    expect(migration).not.toMatch(/NOT NULL|UPDATE|DELETE|SpotCategory|ALTER TABLE "Spot"/)
  })
})

afterAll(() => vi.unstubAllGlobals())
