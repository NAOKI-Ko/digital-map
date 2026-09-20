import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../prisma/generated/client'
import { ARIMATSU_SPOTS, ARIMATSU_USERS, ARIMATSU_WORKSPACES } from './arimatsu-baseline-lib'

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
  try {
    const [users, tenants, maps] = await Promise.all([
      prisma.user.findMany({ orderBy: { email: 'asc' } }),
      prisma.tenant.findMany({ include: { members: true, categories: { orderBy: { order: 'asc' } }, spots: { include: { spotCategories: { include: { category: true } } } }, mediaAssets: true } }),
      prisma.map.findMany({ include: { members: true, floors: true, currentRelease: true, releases: true } }),
    ])
    const failures: string[] = []
    const expect = (condition: boolean, message: string) => { if (!condition) failures.push(message) }
    expect(users.length === 3, `users expected 3, got ${users.length}`)
    expect(tenants.length === 3, `workspaces expected 3, got ${tenants.length}`)
    expect(maps.length === 3, `maps expected 3, got ${maps.length}`)
    expect(new Set(users.map(user => user.displayName)).size === 3 && ARIMATSU_USERS.every(expected => users.some(user => user.displayName === expected.displayName)), 'exact displayName set mismatch')
    expect(new Set(maps.map(map => map.slug)).size === 3 && ARIMATSU_WORKSPACES.every(expected => maps.some(map => map.slug === expected.mapSlug)), 'public slug set mismatch')

    const logicalSpotSets: string[] = []
    const logicalCategorySets: string[] = []
    for (const workspace of ARIMATSU_WORKSPACES) {
      const tenant = tenants.find(item => item.slug === workspace.tenantSlug)
      const map = maps.find(item => item.slug === workspace.mapSlug)
      expect(Boolean(tenant), `missing workspace ${workspace.tenantSlug}`)
      expect(Boolean(map), `missing map ${workspace.mapSlug}`)
      if (!tenant || !map) continue
      expect(map.tenantId === tenant.id, `${workspace.mapSlug} tenant mismatch`)
      expect(maps.filter(item => item.tenantId === tenant.id).length === 1, `${workspace.tenantSlug} must own exactly one map`)
      expect(tenant.members.length === 3, `${workspace.tenantSlug} must have all 3 users`)
      expect(tenant.members.filter(member => member.role === 'OWNER').length === 1, `${workspace.tenantSlug} must have exactly one OWNER`)
      const owner = users.find(user => user.displayName === ARIMATSU_USERS.find(item => item.key === workspace.key)?.displayName)
      expect(tenant.members.some(member => member.userId === owner?.id && member.role === 'OWNER'), `${workspace.tenantSlug} owner mismatch`)
      expect(map.members.length === 2 && map.members.every(member => member.role === 'EDITOR' && member.userId !== owner?.id), `${workspace.mapSlug} editor matrix mismatch`)
      expect(tenant.spots.length === ARIMATSU_SPOTS.length, `${workspace.tenantSlug} spot count mismatch`)
      expect(tenant.mediaAssets.length === 1 && tenant.mediaAssets[0]?.tenantId === tenant.id, `${workspace.tenantSlug} media ownership mismatch`)
      expect(map.floors.length === 1 && map.floors[0]?.illustrationAssetId === tenant.mediaAssets[0]?.id, `${workspace.mapSlug} illustration ownership mismatch`)
      logicalSpotSets.push(tenant.spots.map(spot => spot.name).sort().join('|'))
      logicalCategorySets.push(tenant.categories.map(category => category.name).sort().join('|'))
      if (process.env.ARIMATSU_REQUIRE_PUBLISHED === 'true') {
        expect(map.isPublished && Boolean(map.currentReleaseId), `${workspace.mapSlug} is not published`)
        expect(map.currentRelease?.status === 'READY' && Boolean(map.currentRelease.readyAt) && Boolean(map.currentRelease.manifestKey), `${workspace.mapSlug} current release is not READY`)
      }
    }
    expect(new Set(logicalSpotSets).size === 1, 'canonical spot sets differ across tenants')
    expect(new Set(logicalCategorySets).size === 1, 'category sets differ across tenants')
    const tenantIds = new Set(tenants.map(tenant => tenant.id))
    expect(tenants.every(tenant => tenant.spots.every(spot => tenantIds.has(spot.tenantId) && spot.tenantId === tenant.id)), 'cross-tenant Spot ownership leak')

    const result = { status: failures.length === 0 ? 'PASS' : 'FAIL', counts: { users: users.length, workspaces: tenants.length, maps: maps.length, spots: tenants.reduce((sum, tenant) => sum + tenant.spots.length, 0), spotsPerMap: ARIMATSU_SPOTS.length, categories: tenants.reduce((sum, tenant) => sum + tenant.categories.length, 0), mediaAssets: tenants.reduce((sum, tenant) => sum + tenant.mediaAssets.length, 0), readyReleases: maps.filter(map => map.currentRelease?.status === 'READY').length }, failures }
    console.info(JSON.stringify(result, null, 2))
    if (failures.length) process.exitCode = 1
  }
  finally { await prisma.$disconnect() }
}

main().catch(error => { console.error(error instanceof Error ? error.message : 'Arimatsu baseline audit failed'); process.exitCode = 2 })
