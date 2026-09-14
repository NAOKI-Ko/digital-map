import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = new URL('..', import.meta.url).pathname

function filesRecursively(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? filesRecursively(join(directory, entry.name))
    : [join(directory, entry.name)])
}

describe('KAN-52 route authorization contract', () => {
  it('すべてのMap admin endpointが共通server-side guardを呼ぶ', () => {
    const routes = filesRecursively(join(root, 'server/api/maps')).filter(file => file.endsWith('.ts'))
    expect(routes.length).toBeGreaterThan(40)
    for (const route of routes) {
      const source = readFileSync(route, 'utf8')
      expect(source, route).toMatch(/require(?:OwnedMap|OwnedFloor|OwnedSpot|MapAccess|TenantMember|TenantOwner)/)
    }
  })

  it('Map作成・削除・Editor割当はOwner guardを持つ', () => {
    const protectedRoutes = [
      'server/api/maps/index.post.ts',
      'server/api/maps/[mapId]/index.delete.ts',
      'server/api/maps/[mapId]/editors/index.get.ts',
      'server/api/maps/[mapId]/editors/index.post.ts',
      'server/api/maps/[mapId]/editors/[userId].delete.ts',
    ]
    for (const route of protectedRoutes) expect(readFileSync(join(root, route), 'utf8')).toContain('requireTenantOwner')
  })

  it('member招待はdirectory検索や事前membership作成を公開しない', () => {
    const source = readFileSync(join(root, 'server/api/organization/members/index.post.ts'), 'utf8')
    expect(source).not.toContain('findMany')
    expect(source).not.toContain('contains:')
    expect(source).toContain('issueOrganizationInvitation')
    expect(source).not.toContain('tenantMember.create')
  })

  it('migrationは決定不能なOwnerを推測せず中断し、Spot Editorを先行実装しない', () => {
    const migration = readFileSync(join(root, 'prisma/migrations/20260913060000_organization_map_rbac/migration.sql'), 'utf8')
    expect(migration).toContain('tenant without a deterministically known owner')
    expect(migration).toContain('BEGIN;')
    expect(migration).toContain('COMMIT;')
    expect(migration).not.toContain('SpotAssignment')
  })
})
