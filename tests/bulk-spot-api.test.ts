import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireOwnedMap: vi.fn(),
  readBody: vi.fn(),
  findMany: vi.fn(),
  transaction: vi.fn(),
  validateSpotCategories: vi.fn(),
  deleteManySpots: vi.fn(),
  updateManySpots: vi.fn(),
  deleteManyRelations: vi.fn(),
  createManyRelations: vi.fn(),
}))

type Handler = (event: unknown) => Promise<unknown>
let handler: Handler

function testError(input: { statusCode: number, statusMessage: string }) {
  return Object.assign(new Error(input.statusMessage), input)
}

describe('release security: Spot bulk API', () => {
  beforeAll(async () => {
    vi.stubGlobal('defineEventHandler', (value: Handler) => value)
    vi.stubGlobal('requireOwnedMap', mocks.requireOwnedMap)
    vi.stubGlobal('readBody', mocks.readBody)
    vi.stubGlobal('createError', testError)
    vi.stubGlobal('validateSpotCategories', mocks.validateSpotCategories)
    vi.stubGlobal('prisma', {
      spot: { findMany: mocks.findMany },
      $transaction: mocks.transaction,
    })
    handler = (await import('../server/api/maps/[mapId]/spots/bulk.patch')).default as Handler
  })

  beforeEach(() => {
    const transactionClient = {
      spot: { deleteMany: mocks.deleteManySpots, updateMany: mocks.updateManySpots },
      spotCategory: { deleteMany: mocks.deleteManyRelations, createMany: mocks.createManyRelations },
    }
    mocks.requireOwnedMap.mockReset().mockResolvedValue({ map: { id: 'map-a' } })
    mocks.readBody.mockReset()
    mocks.findMany.mockReset()
    mocks.validateSpotCategories.mockReset().mockResolvedValue([])
    mocks.deleteManySpots.mockReset()
    mocks.updateManySpots.mockReset()
    mocks.deleteManyRelations.mockReset()
    mocks.createManyRelations.mockReset()
    mocks.transaction.mockReset().mockImplementation(async callback => callback(transactionClient))
  })

  afterAll(() => vi.unstubAllGlobals())

  it('他Map Spotが1件でも混ざればtransaction前に全体を拒否する', async () => {
    mocks.readBody.mockResolvedValue({ action: 'delete', spotIds: ['spot-a', 'spot-b'] })
    mocks.findMany.mockResolvedValue([{ id: 'spot-a', x: 0.5, y: 0.5 }])

    await expect(handler({})).rejects.toMatchObject({ statusCode: 404 })
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: { in: ['spot-a', 'spot-b'] }, floor: { mapId: 'map-a' } },
    }))
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('位置未設定Spotを含む一括公開をtransaction前に拒否する', async () => {
    mocks.readBody.mockResolvedValue({ action: 'publish', spotIds: ['spot-a'] })
    mocks.findMany.mockResolvedValue([{ id: 'spot-a', x: null, y: null }])

    await expect(handler({})).rejects.toMatchObject({ statusCode: 422 })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('重複Spot IDを除去し、選択SpotだけのCategory relationをtransaction内で全置換する', async () => {
    mocks.readBody.mockResolvedValue({ action: 'setCategories', spotIds: ['spot-a', 'spot-a', 'spot-b'], categoryIds: ['category-a'] })
    mocks.findMany.mockResolvedValue([
      { id: 'spot-a', x: 0.25, y: 0.25 },
      { id: 'spot-b', x: 0.75, y: 0.75 },
    ])
    mocks.validateSpotCategories.mockResolvedValue([{ id: 'category-a' }])

    await expect(handler({})).resolves.toEqual({ updatedCount: 2 })
    expect(mocks.validateSpotCategories).toHaveBeenCalledWith(expect.anything(), 'map-a', ['category-a'])
    expect(mocks.deleteManyRelations).toHaveBeenCalledWith({ where: { spotId: { in: ['spot-a', 'spot-b'] } } })
    expect(mocks.createManyRelations).toHaveBeenCalledWith({
      data: [
        { spotId: 'spot-a', categoryId: 'category-a' },
        { spotId: 'spot-b', categoryId: 'category-a' },
      ],
    })
  })

  it('transaction失敗時は成功responseを返さない', async () => {
    mocks.readBody.mockResolvedValue({ action: 'unpublish', spotIds: ['spot-a'] })
    mocks.findMany.mockResolvedValue([{ id: 'spot-a', x: 0.5, y: 0.5 }])
    mocks.transaction.mockRejectedValue(new Error('transaction failed'))

    await expect(handler({})).rejects.toThrow('transaction failed')
  })
})
