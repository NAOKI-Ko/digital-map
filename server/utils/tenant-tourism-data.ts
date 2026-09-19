import type { Prisma, PrismaClient } from '~~/prisma/generated/client'
import { prisma } from './prisma'

type TenantDataClient = Prisma.TransactionClient | PrismaClient

export class TenantAlreadyHasMapError extends Error {
  constructor() {
    super('TENANT_ALREADY_HAS_MAP')
    this.name = 'TenantAlreadyHasMapError'
  }
}

export async function assertTenantCanCreateMap(
  client: TenantDataClient,
  tenantId: string,
) {
  await client.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${tenantId}, 0))`
  const existingMap = await client.map.findFirst({
    where: { tenantId },
    select: { id: true },
  })
  if (existingMap) throw new TenantAlreadyHasMapError()
}

export function getTenantSpots(tenantId: string, client: TenantDataClient = prisma) {
  return client.spot.findMany({
    where: { tenantId },
    include: {
      floor: { select: { id: true, mapId: true, name: true } },
      spotCategories: { include: { category: true } },
    },
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
  })
}

export function getTenantSpotById(tenantId: string, spotId: string, client: TenantDataClient = prisma) {
  return client.spot.findFirst({
    where: { id: spotId, tenantId },
    include: {
      floor: { select: { id: true, mapId: true, name: true } },
      spotCategories: { include: { category: true } },
    },
  })
}

export function getTenantCategories(tenantId: string, client: TenantDataClient = prisma) {
  return client.category.findMany({
    where: { tenantId },
    orderBy: [{ order: 'asc' }, { name: 'asc' }, { id: 'asc' }],
  })
}

export async function floorBelongsToTenant(
  client: TenantDataClient,
  tenantId: string,
  floorId: string,
) {
  return (await client.mapFloor.count({
    where: { id: floorId, map: { tenantId } },
  })) === 1
}

export async function mapBelongsToTenant(
  client: TenantDataClient,
  tenantId: string,
  mapId: string,
) {
  return (await client.map.count({
    where: { id: mapId, tenantId },
  })) === 1
}

export async function spotAndCategoryShareTenant(
  client: TenantDataClient,
  spotId: string,
  categoryId: string,
) {
  const [spot, category] = await Promise.all([
    client.spot.findUnique({ where: { id: spotId }, select: { tenantId: true } }),
    client.category.findUnique({ where: { id: categoryId }, select: { tenantId: true } }),
  ])
  return Boolean(spot && category && spot.tenantId === category.tenantId)
}
