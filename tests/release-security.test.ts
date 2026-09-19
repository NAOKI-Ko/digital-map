import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFile } from 'node:fs/promises'

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  getRouterParam: vi.fn(),
  mapFindUnique: vi.fn(),
  tenantMemberFindUnique: vi.fn(),
  mapMemberFindUnique: vi.fn(),
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
    vi.stubGlobal('requireUser', mocks.requireUser)
    vi.stubGlobal('getRouterParam', mocks.getRouterParam)
    vi.stubGlobal('createError', testError)
    vi.stubGlobal('prisma', {
      map: { findUnique: mocks.mapFindUnique },
      tenantMember: { findUnique: mocks.tenantMemberFindUnique },
      mapMember: { findUnique: mocks.mapMemberFindUnique },
      mapFloor: { findFirst: mocks.floorFindFirst },
      spot: { findFirst: mocks.spotFindFirst },
      category: { findFirst: mocks.categoryFindFirst },
    })
    ;({ requireOwnedMap, requireOwnedFloor, requireOwnedSpot } = await import('../server/utils/map-access'))
    ;({ requireOwnedCategory } = await import('../server/utils/category'))
  })

  beforeEach(() => {
    mocks.requireUser.mockReset().mockResolvedValue({ user: { id: 'owner-a', tenantId: 'tenant-a' } })
    mocks.getRouterParam.mockReset().mockImplementation((_event, key) => ({ mapId: 'map-a', floorId: 'floor-a', spotId: 'spot-a' })[key])
    mocks.mapFindUnique.mockReset().mockResolvedValue({ id: 'map-a', name: 'Map A', tenantId: 'tenant-a' })
    mocks.tenantMemberFindUnique.mockReset().mockResolvedValue({ role: 'OWNER' })
    mocks.mapMemberFindUnique.mockReset().mockResolvedValue(null)
    mocks.floorFindFirst.mockReset().mockResolvedValue({ id: 'floor-a', mapId: 'map-a', order: 0, imageWidth: 1000, imageHeight: 500 })
    mocks.spotFindFirst.mockReset().mockResolvedValue({ id: 'spot-a', floorId: 'floor-a', x: 0.5, y: 0.5, isPublished: false })
    mocks.categoryFindFirst.mockReset().mockResolvedValue({ id: 'category-a', mapId: 'map-a', _count: { spotCategories: 0 } })
  })

  afterAll(() => vi.unstubAllGlobals())

  it('OwnerはMapMemberなしでMapへアクセスできる', async () => {
    await requireOwnedMap({} as never)
    expect(mocks.tenantMemberFindUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId_userId: { tenantId: 'tenant-a', userId: 'owner-a' } } }))
    expect(mocks.mapMemberFindUnique).not.toHaveBeenCalled()
  })

  it('他tenant Mapは404として拒否する', async () => {
    mocks.mapFindUnique.mockResolvedValue({ id: 'map-b', name: 'Map B', tenantId: 'tenant-b' })
    await expect(requireOwnedMap({} as never)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('割り当て済みEditorは許可し、未割り当てMemberは拒否する', async () => {
    mocks.requireUser.mockResolvedValue({ user: { id: 'member-a', tenantId: 'tenant-a' } })
    mocks.tenantMemberFindUnique.mockResolvedValue({ role: 'MEMBER' })
    mocks.mapMemberFindUnique.mockResolvedValue({ role: 'EDITOR' })
    await expect(requireOwnedMap({} as never)).resolves.toMatchObject({ isOwner: false })
    mocks.mapMemberFindUnique.mockResolvedValue(null)
    await expect(requireOwnedMap({} as never)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('FloorとSpotをownership確認済みMapへ制約する', async () => {
    await requireOwnedFloor({} as never)
    await requireOwnedSpot({} as never)
    expect(mocks.floorFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'floor-a', mapId: 'map-a' } }))
    expect(mocks.spotFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'spot-a', tenantId: 'tenant-a', floor: { mapId: 'map-a' } } }))
  })

  it('Category IDだけを知っていても別Mapから取得できない', async () => {
    mocks.categoryFindFirst.mockResolvedValue(null)
    await expect(requireOwnedCategory('map-a', 'tenant-a', 'category-b')).rejects.toMatchObject({ statusCode: 404 })
    expect(mocks.categoryFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'category-b', mapId: 'map-a', tenantId: 'tenant-a' } }))
  })

  it('IMAGE spatial audit supports both legacy GEO and already-migrated schemas', async () => {
    const source = await readFile('scripts/audit-image-spatial-migration.ts', 'utf8')
    expect(source).toContain("column_name = 'x'")
    expect(source).toContain("schema: 'IMAGE'")
    expect(source).toContain("schema: 'LEGACY_GEO'")
    expect(source).toContain('("x" IS NULL) <> ("y" IS NULL)')
    expect(source).toContain('"x" < 0 OR "x" > 1')
  })
})
