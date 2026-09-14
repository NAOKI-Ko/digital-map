import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { appendAuditEvent, sanitizeAuditMetadata } from '../server/utils/audit'

describe('WU-25 append-only audit log', () => {
  it('recursively strips secret-bearing metadata keys', () => {
    const sanitized = sanitizeAuditMetadata({
      userId: 'u-1', token: 'raw', nested: { passwordHash: 'hash', role: 'MEMBER' }, headers: { cookie: 'secret' },
    })
    expect(sanitized).toEqual({ userId: 'u-1', nested: { role: 'MEMBER' } })
    expect(JSON.stringify(sanitized)).not.toContain('raw')
    expect(JSON.stringify(sanitized)).not.toContain('secret')
  })

  it('writes tenant, actor, target and concise sanitized metadata only', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'audit-1' })
    await appendAuditEvent({ auditEvent: { create } }, {
      tenantId: 'tenant-a', actorUserId: 'owner-1', action: 'TENANT_MEMBER_ROLE_CHANGED',
      targetType: 'TenantMember', targetId: 'member-1', metadata: { oldRole: 'MEMBER', newRole: 'OWNER', resetToken: 'never' },
    })
    expect(create).toHaveBeenCalledWith({ data: expect.objectContaining({
      tenantId: 'tenant-a', actorUserId: 'owner-1', action: 'TENANT_MEMBER_ROLE_CHANGED', targetId: 'member-1',
      metadata: { oldRole: 'MEMBER', newRole: 'OWNER' },
    }) })
  })

  it('enforces owner-only tenant-scoped newest-first reads and exposes no mutation route', () => {
    const route = readFileSync(new URL('../server/api/organization/audit/index.get.ts', import.meta.url), 'utf8')
    const page = readFileSync(new URL('../app/pages/admin/organization/audit.vue', import.meta.url), 'utf8')
    const migration = readFileSync(new URL('../prisma/migrations/20260914030000_audit_events/migration.sql', import.meta.url), 'utf8')
    expect(route).toContain('requireTenantOwner')
    expect(route).toContain('tenantId: tenant.id')
    expect(route).toContain("createdAt: 'desc'")
    expect(route).not.toMatch(/auditEvent\.(?:update|delete)/)
    expect(page).toContain("await useFetch('/api/organization/audit')")
    expect(page).not.toContain('await load()')
    expect(migration).toContain('AuditEvent_no_update_or_delete')
  })
})
