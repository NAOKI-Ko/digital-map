import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const source = (path: string) => readFileSync(join(root, path), 'utf8')

describe('Phase 1 + KAN-52 integration contract', () => {
  it('final schema preserves Phase 1 spatial/content data and KAN-52 memberships', () => {
    const schema = source('prisma/schema.prisma')

    for (const model of [
      'TenantMember',
      'MapMember',
      'MediaAsset',
      'SpotFieldDefinition',
      'SpotFieldValue',
      'FloorDecoration',
    ]) expect(schema).toContain(`model ${model} {`)

    expect(schema).toMatch(/model Spot \{[\s\S]*?\n  x\s+Float\?/) 
    expect(schema).toMatch(/model Spot \{[\s\S]*?\n  y\s+Float\?/) 
    expect(schema).not.toMatch(/model Spot \{[\s\S]*?\n  (?:lat|lng)\s+/)
    expect(schema).toContain('pinSize')
    expect(schema).toContain('importance')
    expect(schema).toContain('refAImageX')
    expect(schema).toContain('refBImageY')
  })

  it('combined migration chain orders Phase 1 data structures before RBAC', () => {
    const migrations = readdirSync(join(root, 'prisma/migrations'))
      .filter(name => /^\d/.test(name))
      .sort()

    const media = migrations.indexOf('20260913020000_tenant_media_library')
    const fields = migrations.indexOf('20260913030000_spot_field_definitions')
    const decorations = migrations.indexOf('20260913040000_floor_decorations')
    const pins = migrations.indexOf('20260913050000_spot_pin_size')
    const rbac = migrations.indexOf('20260913060000_organization_map_rbac')
    expect(media).toBeGreaterThan(-1)
    expect(media).toBeLessThan(fields)
    expect(fields).toBeLessThan(decorations)
    expect(decorations).toBeLessThan(pins)
    expect(pins).toBeLessThan(rbac)

    const rbacMigration = source('prisma/migrations/20260913060000_organization_map_rbac/migration.sql')
    expect(rbacMigration).toContain('BEGIN;')
    expect(rbacMigration).toContain('tenant without a deterministically known owner')
    expect(rbacMigration).toContain('FROM "User" u')
    expect(rbacMigration).toContain('COMMIT;')
  })

  it('Phase 1 map mutations resolve a server-side map or nested-resource guard', () => {
    const featureRoutes = {
      map: [
        'server/api/maps/[mapId]/index.patch.ts',
        'server/api/maps/[mapId]/branding.patch.ts',
        'server/api/maps/[mapId]/publish.post.ts',
      ],
      floorAndGeoreference: [
        'server/api/maps/[mapId]/floors/index.post.ts',
        'server/api/maps/[mapId]/floors/[floorId]/index.patch.ts',
        'server/api/maps/[mapId]/floors/[floorId]/index.delete.ts',
        'server/api/maps/[mapId]/floors/[floorId]/georeference.patch.ts',
        'server/api/maps/[mapId]/floors/[floorId]/georeference.delete.ts',
      ],
      spotAndPin: [
        'server/api/maps/[mapId]/spots/index.post.ts',
        'server/api/maps/[mapId]/spots/[spotId]/index.patch.ts',
        'server/api/maps/[mapId]/spots/[spotId]/design.patch.ts',
        'server/api/maps/[mapId]/spots/[spotId]/position.patch.ts',
        'server/api/maps/[mapId]/spots/[spotId]/position.delete.ts',
        'server/api/maps/[mapId]/spots/[spotId]/publish.patch.ts',
        'server/api/maps/[mapId]/spots/bulk.patch.ts',
      ],
      category: [
        'server/api/maps/[mapId]/categories/index.post.ts',
        'server/api/maps/[mapId]/categories/[categoryId]/index.patch.ts',
        'server/api/maps/[mapId]/categories/[categoryId]/index.delete.ts',
        'server/api/maps/[mapId]/category-icons.post.ts',
      ],
      spotFieldsAndCsv: [
        'server/api/maps/[mapId]/spot-fields/index.post.ts',
        'server/api/maps/[mapId]/spot-fields/[fieldId].patch.ts',
        'server/api/maps/[mapId]/spot-fields/[fieldId].delete.ts',
        'server/api/maps/[mapId]/spots/import/preview.post.ts',
        'server/api/maps/[mapId]/spots/import/index.post.ts',
      ],
      decoration: [
        'server/api/maps/[mapId]/floors/[floorId]/decorations/index.post.ts',
        'server/api/maps/[mapId]/floors/[floorId]/decorations/[decorationId].patch.ts',
        'server/api/maps/[mapId]/floors/[floorId]/decorations/[decorationId].delete.ts',
      ],
    }

    for (const routes of Object.values(featureRoutes)) {
      for (const route of routes) {
        expect(source(route), route).toMatch(/require(?:OwnedMap|OwnedFloor|OwnedSpot|MapAccess)/)
      }
    }
  })

  it('Tenant Media Library allows eligible members but keeps attachment and deletion boundaries', () => {
    expect(source('server/api/media/index.get.ts')).toContain('requireTenantMediaAccess')
    expect(source('server/api/uploads/image.post.ts')).toContain('requireTenantMediaAccess')
    expect(source('server/api/media/[assetId].delete.ts')).toContain('requireOwnedMediaAsset')
    expect(source('server/utils/media.ts')).toContain('requireTenantOwner')

    for (const route of [
      'server/api/maps/[mapId]/spots/[spotId]/design.patch.ts',
      'server/api/maps/[mapId]/categories/index.post.ts',
      'server/api/maps/[mapId]/floors/index.post.ts',
      'server/api/maps/[mapId]/floors/[floorId]/decorations/index.post.ts',
    ]) {
      const routeSource = source(route)
      expect(routeSource, route).toMatch(/require(?:OwnedMap|OwnedFloor|OwnedSpot|MapAccess)/)
      expect(routeSource, route).toContain('resolveTenantMediaAsset')
    }
  })

  it('active organization filters the admin map list without changing public visibility rules', () => {
    const mapList = source('server/api/maps/index.get.ts')
    expect(mapList).toContain('requireTenantMember')
    expect(mapList).toContain('tenantId: session.user.tenantId')
    expect(mapList).toContain("members: { some: { userId: session.user.id, role: 'EDITOR' } }")

    const middleware = source('server/middleware/00.auth-check.ts')
    expect(middleware).not.toContain("'/api/public'")

    const publicMap = source('server/utils/public-map.ts')
    expect(publicMap).toContain('isPublished: true')
    expect(publicMap).toContain('publicVisible: true')
    expect(publicMap).toContain('x: { not: null }')
    expect(publicMap).toContain('y: { not: null }')
  })
})
