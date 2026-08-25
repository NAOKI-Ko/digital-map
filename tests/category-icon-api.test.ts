import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireOwnedMap: vi.fn(),
  requireOwnedCategory: vi.fn(),
  readBody: vi.fn(),
  aggregate: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}))

type Handler = (event: unknown) => Promise<unknown>
let createHandler: Handler
let updateHandler: Handler

function summary(category: any) {
  return { ...category, spotCount: category._count.spotCategories }
}

describe('Category icon API ownership', () => {
  beforeAll(async () => {
    vi.stubGlobal('defineEventHandler', (value: Handler) => value)
    vi.stubGlobal('requireOwnedMap', mocks.requireOwnedMap)
    vi.stubGlobal('requireOwnedCategory', mocks.requireOwnedCategory)
    vi.stubGlobal('readBody', mocks.readBody)
    vi.stubGlobal('getRouterParam', () => 'category-a')
    vi.stubGlobal('setResponseStatus', vi.fn())
    vi.stubGlobal('toCategorySummary', summary)
    vi.stubGlobal('isUniqueConstraintError', () => false)
    vi.stubGlobal('createError', (input: { statusCode: number, statusMessage: string }) => Object.assign(new Error(input.statusMessage), input))
    vi.stubGlobal('prisma', { category: { aggregate: mocks.aggregate, create: mocks.create, update: mocks.update } })
    createHandler = (await import('../server/api/maps/[mapId]/categories/index.post')).default as Handler
    updateHandler = (await import('../server/api/maps/[mapId]/categories/[categoryId]/index.patch')).default as Handler
  })

  beforeEach(() => {
    mocks.requireOwnedMap.mockReset().mockResolvedValue({ map: { id: 'map-a' } })
    mocks.requireOwnedCategory.mockReset().mockResolvedValue({ id: 'category-a' })
    mocks.readBody.mockReset()
    mocks.aggregate.mockReset().mockResolvedValue({ _max: { order: 0 } })
    mocks.create.mockReset().mockImplementation(async ({ data }) => ({ id: 'category-new', ...data, _count: { spotCategories: 0 } }))
    mocks.update.mockReset().mockImplementation(async ({ data }) => ({ id: 'category-a', mapId: 'map-a', name: '観光', order: 0, ...data, _count: { spotCategories: 1 } }))
  })

  afterAll(() => vi.unstubAllGlobals())

  it('所有Map内へpreset Categoryを作成する', async () => {
    mocks.readBody.mockResolvedValue({ name: '飲食', iconType: 'preset', iconPresetId: 'material:restaurant', iconImageUrl: null })
    await createHandler({})
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ mapId: 'map-a', iconType: 'preset', iconPresetId: 'material:restaurant', iconImageUrl: null }) }))
  })

  it('他tenant Mapがownership確認で拒否されたら書き込まない', async () => {
    mocks.requireOwnedMap.mockRejectedValueOnce(Object.assign(new Error('not found'), { statusCode: 404 }))
    mocks.readBody.mockResolvedValue({ name: '越境', iconType: null, iconPresetId: null, iconImageUrl: null })
    await expect(createHandler({})).rejects.toMatchObject({ statusCode: 404 })
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('同tenant別MapのCategory IDも所有Map IDとの組み合わせで照合する', async () => {
    mocks.requireOwnedCategory.mockRejectedValueOnce(Object.assign(new Error('not found'), { statusCode: 404 }))
    mocks.readBody.mockResolvedValue({ iconType: null, iconPresetId: null, iconImageUrl: null })
    await expect(updateHandler({})).rejects.toMatchObject({ statusCode: 404 })
    expect(mocks.requireOwnedCategory).toHaveBeenCalledWith('map-a', 'category-a')
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('別Mapのcustom画像pathを関連付けできない', async () => {
    mocks.readBody.mockResolvedValue({ iconType: 'custom', iconPresetId: null, iconImageUrl: '/uploads/category-icon-map-b--12345678-1234-4123-8123-123456789abc.png' })
    await expect(updateHandler({})).rejects.toMatchObject({ statusCode: 422 })
    expect(mocks.update).not.toHaveBeenCalled()
  })
})
