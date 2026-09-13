import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireOwnedMap: vi.fn(),
  getQuery: vi.fn(),
  findMany: vi.fn(),
}))

type Handler = (event: unknown) => Promise<unknown>
let handler: Handler

describe('Spot duplicate warning', () => {
  beforeAll(async () => {
    vi.stubGlobal('defineEventHandler', (value: Handler) => value)
    vi.stubGlobal('requireOwnedMap', mocks.requireOwnedMap)
    vi.stubGlobal('getQuery', mocks.getQuery)
    vi.stubGlobal('prisma', { spot: { findMany: mocks.findMany } })
    handler = (await import('../server/api/maps/[mapId]/spots/duplicates.get')).default as Handler
  })

  beforeEach(() => {
    mocks.requireOwnedMap.mockReset().mockResolvedValue({ map: { id: 'map-a' } })
    mocks.getQuery.mockReset().mockReturnValue({ name: ' Same name ' })
    mocks.findMany.mockReset().mockResolvedValue([])
  })

  afterAll(() => vi.unstubAllGlobals())

  it('limits duplicate lookup to the owned Map and compares the trimmed name case-insensitively', async () => {
    await handler({})

    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        name: { equals: 'Same name', mode: 'insensitive' },
        floor: { mapId: 'map-a' },
      },
      take: 10,
    }))
  })

  it('excludes the edited Spot itself and returns useful warning context', async () => {
    mocks.getQuery.mockReturnValue({ name: 'Same name', excludeId: 'spot-self' })
    mocks.findMany.mockResolvedValue([{
      id: 'spot-other',
      name: 'Same name',
      x: 0.4,
      y: 0.7,
      floor: { name: '2F' },
      spotCategories: [{ category: { name: 'カフェ' } }],
    }])

    await expect(handler({})).resolves.toEqual({
      matches: [{
        id: 'spot-other',
        name: 'Same name',
        floorName: '2F',
        categoryNames: ['カフェ'],
        positioned: true,
      }],
    })
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: { not: 'spot-self' } }),
    }))
  })

  it('does not query for an empty name', async () => {
    mocks.getQuery.mockReturnValue({ name: '   ' })

    await expect(handler({})).resolves.toEqual({ matches: [] })
    expect(mocks.findMany).not.toHaveBeenCalled()
  })
})
