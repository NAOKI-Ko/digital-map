import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
  getRouterParam: vi.fn(),
  mapFindFirst: vi.fn(),
  floorFindFirst: vi.fn(),
  spotFindFirst: vi.fn(),
  categoryFindFirst: vi.fn(),
}))

function testError(input: { statusCode: number, statusMessage: string }) {
  return Object.assign(new Error(input.statusMessage), input)
}

describe('release security: tenant / Map ownership boundary', () => {
  let requireOwnedMap: typeof import('../server/utils/map-access').requireOwnedMap
  let requireOwnedFloor: typeof import('../server/utils/map-access').requireOwnedFloor
  let requireOwnedSpot: typeof import('../server/utils/map-access').requireOwnedSpot
  let requireOwnedCategory: typeof import('../server/utils/category').requireOwnedCategory

  beforeAll(async () => {
    vi.stubGlobal('requireAdminSession', mocks.requireAdminSession)
    vi.stubGlobal('getRouterParam', mocks.getRouterParam)
    vi.stubGlobal('createError', testError)
    vi.stubGlobal('prisma', {
      map: { findFirst: mocks.mapFindFirst },
      mapFloor: { findFirst: mocks.floorFindFirst },
      spot: { findFirst: mocks.spotFindFirst },
      category: { findFirst: mocks.categoryFindFirst },
    })
    ;({ requireOwnedMap, requireOwnedFloor, requireOwnedSpot } = await import('../server/utils/map-access'))
    ;({ requireOwnedCategory } = await import('../server/utils/category'))
  })

  beforeEach(() => {
    mocks.requireAdminSession.mockReset().mockResolvedValue({ user: { tenantId: 'tenant-a' } })
    mocks.getRouterParam.mockReset().mockImplementation((_event, key) => ({ mapId: 'map-a', floorId: 'floor-a', spotId: 'spot-a' })[key])
    mocks.mapFindFirst.mockReset().mockResolvedValue({ id: 'map-a', name: 'Map A' })
    mocks.floorFindFirst.mockReset().mockResolvedValue({ id: 'floor-a', mapId: 'map-a', order: 0, imageWidth: 1000, imageHeight: 500 })
    mocks.spotFindFirst.mockReset().mockResolvedValue({ id: 'spot-a', floorId: 'floor-a', lat: 35, lng: 139, isPublished: false })
    mocks.categoryFindFirst.mockReset().mockResolvedValue({ id: 'category-a', mapId: 'map-a', _count: { spotCategories: 0 } })
  })

  afterAll(() => vi.unstubAllGlobals())

  it('Map取得をsession tenantIdで制約する', async () => {
    await requireOwnedMap({} as never)
    expect(mocks.mapFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'map-a', tenantId: 'tenant-a' },
    }))
  })

  it('他tenant Mapは404として拒否する', async () => {
    mocks.mapFindFirst.mockResolvedValue(null)
    await expect(requireOwnedMap({} as never)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('FloorとSpotをownership確認済みMapへ制約する', async () => {
    await requireOwnedFloor({} as never)
    await requireOwnedSpot({} as never)
    expect(mocks.floorFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'floor-a', mapId: 'map-a' } }))
    expect(mocks.spotFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'spot-a', floor: { mapId: 'map-a' } } }))
  })

  it('Category IDだけを知っていても別Mapから取得できない', async () => {
    mocks.categoryFindFirst.mockResolvedValue(null)
    await expect(requireOwnedCategory('map-a', 'category-b')).rejects.toMatchObject({ statusCode: 404 })
    expect(mocks.categoryFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'category-b', mapId: 'map-a' } }))
  })
})
