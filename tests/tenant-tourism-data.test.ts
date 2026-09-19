import { describe, expect, it, vi } from 'vitest'
import {
  floorBelongsToTenant,
  getTenantCategories,
  getTenantSpotById,
  getTenantSpots,
  mapBelongsToTenant,
  spotAndCategoryShareTenant,
} from '../server/utils/tenant-tourism-data'

describe('Tenant tourism data query layer', () => {
  it('SpotとCategoryをTenantで直接scopeする', async () => {
    const spotFindMany = vi.fn().mockResolvedValue([])
    const spotFindFirst = vi.fn().mockResolvedValue(null)
    const categoryFindMany = vi.fn().mockResolvedValue([])
    const client = {
      spot: { findMany: spotFindMany, findFirst: spotFindFirst },
      category: { findMany: categoryFindMany },
    } as never

    await getTenantSpots('tenant-a', client)
    await getTenantSpotById('tenant-a', 'spot-a', client)
    await getTenantCategories('tenant-a', client)

    expect(spotFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: 'tenant-a' } }))
    expect(spotFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'spot-a', tenantId: 'tenant-a' } }))
    expect(categoryFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: 'tenant-a' } }))
  })

  it('FloorとMapのTenant一致を明示的に検査する', async () => {
    const client = {
      mapFloor: { count: vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(0) },
      map: { count: vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(0) },
    } as never
    await expect(floorBelongsToTenant(client, 'tenant-a', 'floor-a')).resolves.toBe(true)
    await expect(floorBelongsToTenant(client, 'tenant-a', 'floor-b')).resolves.toBe(false)
    await expect(mapBelongsToTenant(client, 'tenant-a', 'map-a')).resolves.toBe(true)
    await expect(mapBelongsToTenant(client, 'tenant-a', 'map-b')).resolves.toBe(false)
  })

  it('SpotCategoryは同じTenantだけを許可する', async () => {
    const matching = {
      spot: { findUnique: vi.fn().mockResolvedValue({ tenantId: 'tenant-a' }) },
      category: { findUnique: vi.fn().mockResolvedValue({ tenantId: 'tenant-a' }) },
    } as never
    const crossing = {
      spot: { findUnique: vi.fn().mockResolvedValue({ tenantId: 'tenant-a' }) },
      category: { findUnique: vi.fn().mockResolvedValue({ tenantId: 'tenant-b' }) },
    } as never
    await expect(spotAndCategoryShareTenant(matching, 'spot-a', 'category-a')).resolves.toBe(true)
    await expect(spotAndCategoryShareTenant(crossing, 'spot-a', 'category-b')).resolves.toBe(false)
  })
})
