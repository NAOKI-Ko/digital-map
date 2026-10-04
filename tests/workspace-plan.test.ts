import { describe, it, expect } from 'vitest'
import { planSimulationSchema } from '../shared/schemas/workspace-plan'
import { canChangePublishedMapUsage, resolveWorkspaceContract, resolveEntitlements, simulateWorkspacePlan } from '../shared/utils/workspace-plan'

describe('Workspace contract / entitlements / downgrade policy', () => {
  it('binds beta to Workspace, keeps status separate, and isolates resolver results', () => {
    const a = resolveWorkspaceContract('workspace-a'), b = resolveWorkspaceContract('workspace-b')
    expect(a).toEqual({ workspaceId: 'workspace-a', planCode: 'STANDARD', status: 'beta', source: 'beta-default' })
    expect(b.workspaceId).toBe('workspace-b')
    const entitlements = resolveEntitlements(a)
    entitlements.publicMap = false
    expect(resolveEntitlements(b).publicMap).toBe(true)
    expect(Object.keys(resolveEntitlements(b))).not.toEqual(expect.arrayContaining(['sso', 'apiAccess', 'sla', 'guestGrantCount']))
    expect(() => resolveEntitlements({ planCode: 'UNKNOWN' as never })).toThrow()
  })
  it('allows safe corrections, rollback and reduction when already over quota, blocking only increases', () => {
    expect(canChangePublishedMapUsage(4, 3, 0)).toBe(true)
    expect(canChangePublishedMapUsage(4, 3, -1)).toBe(true)
    expect(canChangePublishedMapUsage(4, 3, 1)).toBe(false)
    expect(canChangePublishedMapUsage(3, 3, 1)).toBe(false)
    expect(canChangePublishedMapUsage(2, 3, 1)).toBe(true)
    expect(canChangePublishedMapUsage(100, null, 1)).toBe(true)
    const usage = { publishedMaps: 4, retainedMaps: 6, draftMaps: 1, archivedMaps: 1, storageBytes: 456, memberCount: 3 }
    const before = structuredClone(usage)
    expect(simulateWorkspacePlan('STANDARD', usage, 0)).toMatchObject({ persisted: false, existingPublishedMapsPreserved: true, overLimit: true, canIncreasePublishedMaps: false })
    expect(usage).toEqual(before)
  })
  it('validates limits and rejects unsupported billing / Workspace payloads', () => {
    for (const maxPublishedMaps of [-1, 1.1, '3', 1_000_001]) expect(planSimulationSchema.safeParse({ planCode: 'STANDARD', maxPublishedMaps }).success).toBe(false)
    expect(planSimulationSchema.safeParse({ planCode: 'STANDARD', maxPublishedMaps: 0, tenantId: 'other' }).success).toBe(false)
    expect(planSimulationSchema.safeParse({ planCode: 'BETA', maxPublishedMaps: 3 }).success).toBe(false)
    expect(planSimulationSchema.parse({ planCode: 'TOURISM', maxPublishedMaps: null }).maxPublishedMaps).toBeNull()
  })
})
