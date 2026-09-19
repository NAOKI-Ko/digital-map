import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '../server/utils/prisma'
import {
  assertTenantCanCreateMap,
  floorBelongsToTenant,
  getTenantCategories,
  getTenantSpotById,
  getTenantSpots,
  mapBelongsToTenant,
  spotAndCategoryShareTenant,
  TenantAlreadyHasMapError,
} from '../server/utils/tenant-tourism-data'

const databaseConfigured = Boolean(process.env.DATABASE_URL)
const integration = databaseConfigured ? describe : describe.skip

integration('PostgreSQL-backed tenant data foundation integrity', () => {
  const suffix = randomUUID().replaceAll('-', '')
  const tenantA = `wu49-a-${suffix}`
  const tenantB = `wu49-b-${suffix}`
  const tenantCreation = `wu49-create-${suffix}`
  const mapA = `wu49-map-a-${suffix}`
  const mapB = `wu49-map-b-${suffix}`
  const floorA = `wu49-floor-a-${suffix}`
  const floorB = `wu49-floor-b-${suffix}`
  const spotA = `wu49-spot-a-${suffix}`
  const categoryA = `wu49-category-a-${suffix}`
  const categoryB = `wu49-category-b-${suffix}`

  beforeAll(async () => {
    await prisma.tenant.createMany({ data: [
      { id: tenantA, name: 'WU49 Tenant A', slug: tenantA },
      { id: tenantB, name: 'WU49 Tenant B', slug: tenantB },
      { id: tenantCreation, name: 'WU49 Tenant Create', slug: tenantCreation },
    ] })
    await prisma.map.createMany({ data: [
      { id: mapA, tenantId: tenantA, name: 'Map A', slug: mapA },
      { id: mapB, tenantId: tenantB, name: 'Map B', slug: mapB },
    ] })
    await prisma.mapFloor.createMany({ data: [
      { id: floorA, mapId: mapA, name: 'Floor A', illustrationUrl: '/uploads/a.png', imageWidth: 100, imageHeight: 100 },
      { id: floorB, mapId: mapB, name: 'Floor B', illustrationUrl: '/uploads/b.png', imageWidth: 100, imageHeight: 100 },
    ] })
    await prisma.category.createMany({ data: [
      { id: categoryA, tenantId: tenantA, mapId: mapA, name: 'Category A' },
      { id: categoryB, tenantId: tenantB, mapId: mapB, name: 'Category B' },
    ] })
    await prisma.spot.create({
      data: { id: spotA, tenantId: tenantA, floorId: floorA, name: 'Spot A', x: 0.25, y: 0.75, lat: 35, lng: 136 },
    })
  })

  afterAll(async () => {
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantA, tenantB, tenantCreation] } } }).catch(() => undefined)
  })

  it('accepts same-tenant Floor/Map and rejects cross-tenant choices', async () => {
    await expect(floorBelongsToTenant(prisma, tenantA, floorA)).resolves.toBe(true)
    await expect(floorBelongsToTenant(prisma, tenantA, floorB)).resolves.toBe(false)
    await expect(mapBelongsToTenant(prisma, tenantA, mapA)).resolves.toBe(true)
    await expect(mapBelongsToTenant(prisma, tenantA, mapB)).resolves.toBe(false)
  })

  it('accepts same-tenant SpotCategory and rejects cross-tenant relation', async () => {
    await expect(spotAndCategoryShareTenant(prisma, spotA, categoryA)).resolves.toBe(true)
    await expect(spotAndCategoryShareTenant(prisma, spotA, categoryB)).resolves.toBe(false)
    await prisma.spotCategory.create({ data: { spotId: spotA, categoryId: categoryA } })
  })

  it('returns the same canonical rows through Tenant queries', async () => {
    expect((await getTenantSpots(tenantA)).map(spot => spot.id)).toContain(spotA)
    expect((await getTenantSpotById(tenantA, spotA))?.id).toBe(spotA)
    expect((await getTenantCategories(tenantA)).map(category => category.id)).toContain(categoryA)
    await expect(getTenantSpotById(tenantB, spotA)).resolves.toBeNull()
  })

  it('keeps Illustration and real coordinates independently', async () => {
    const spot = await prisma.spot.findUniqueOrThrow({ where: { id: spotA } })
    expect({ x: spot.x, y: spot.y, lat: spot.lat, lng: spot.lng }).toEqual({ x: 0.25, y: 0.75, lat: 35, lng: 136 })
    await expect(prisma.$executeRaw`UPDATE "Spot" SET lat = 91, lng = 136 WHERE id = ${spotA}`).rejects.toThrow()
    expect(await prisma.spot.findUniqueOrThrow({ where: { id: spotA }, select: { x: true, y: true } })).toEqual({ x: 0.25, y: 0.75 })
  })

  it('enforces tenant Category uniqueness and Map capability checks in PostgreSQL', async () => {
    await expect(prisma.category.create({
      data: { tenantId: tenantA, mapId: mapA, name: 'Category A' },
    })).rejects.toThrow()
    expect(await prisma.map.findUniqueOrThrow({
      where: { id: mapA },
      select: { illustrationEnabled: true, realMapEnabled: true, defaultMapView: true },
    })).toEqual({ illustrationEnabled: true, realMapEnabled: false, defaultMapView: 'ILLUSTRATION' })
    await prisma.map.update({
      where: { id: mapA },
      data: { illustrationEnabled: true, realMapEnabled: true, defaultMapView: 'REAL' },
    })
    await expect(prisma.$executeRaw`UPDATE "Map" SET "realMapEnabled" = false WHERE id = ${mapA}`).rejects.toThrow()
  })

  it('enforces one Map per Tenant in PostgreSQL', async () => {
    await expect(prisma.map.create({
      data: { tenantId: tenantA, name: 'Second Map A', slug: `wu49-second-map-${suffix}` },
    })).rejects.toThrow()
    expect(await prisma.map.count({ where: { tenantId: tenantA } })).toBe(1)
  })

  it('serializes creation so exactly one first Map can be created', async () => {
    const attempts = await Promise.allSettled([1, 2].map(index => prisma.$transaction(async (transaction) => {
      await assertTenantCanCreateMap(transaction, tenantCreation)
      return transaction.map.create({
        data: { tenantId: tenantCreation, name: `Created ${index}`, slug: `wu49-created-${index}-${suffix}` },
      })
    })))
    expect(attempts.filter(result => result.status === 'fulfilled')).toHaveLength(1)
    const rejected = attempts.find(result => result.status === 'rejected')
    expect(rejected).toMatchObject({ reason: expect.any(TenantAlreadyHasMapError) })
    expect(await prisma.map.count({ where: { tenantId: tenantCreation } })).toBe(1)
  })
})
