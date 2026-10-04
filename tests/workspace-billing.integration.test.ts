import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { prisma } from '../server/utils/prisma'
import { requireTenantMember, requireTenantOwner } from '../server/utils/session'
import { resolveWorkspaceUsage } from '../server/utils/workspace-plan'

const integration = process.env.DATABASE_URL ? describe : describe.skip
integration('Workspace billing real Usage and independent Authorization', () => {
  const suffix = randomUUID(), tenantId = `wu73-${suffix}`, otherId = `other-${suffix}`
  const owner = `owner-${suffix}`, editor = `editor-${suffix}`, inactive = `inactive-${suffix}`
  let actor = owner
  let getBilling: typeof import('../server/api/organization/billing/index.get').default
  let simulate: typeof import('../server/api/organization/billing/simulate.post').default
  const input = { planCode: 'TOURISM', maxPublishedMaps: 0 }
  beforeAll(async () => {
    if (!/digital_map_(test_|ci)/.test(new URL(process.env.DATABASE_URL!).pathname)) throw Error('Disposable DB required')
    await prisma.tenant.createMany({ data: [tenantId, otherId].map(id => ({ id, name: id, slug: id })) })
    await prisma.user.createMany({ data: [owner, editor, inactive].map(id => ({ id, email: `${id}@example.invalid`, passwordHash: 'test', isActive: id !== inactive })) })
    await prisma.tenantMember.createMany({ data: [owner, editor, inactive].map(userId => ({ tenantId, userId, role: userId === owner ? 'OWNER' : 'MEMBER' })) })
    for (const id of ['published', 'draft', 'unpublished', 'missing', 'building', 'archived', 'foreign']) {
      const map = await prisma.map.create({ data: { id: `${id}-${suffix}`, tenantId, name: id, slug: `${id}-${suffix}`, isPublished: id !== 'draft' && id !== 'unpublished', archivedAt: id === 'archived' ? new Date() : null } })
      if (id !== 'draft' && id !== 'missing') {
        const release = await prisma.publicRelease.create({ data: { mapId: map.id, status: id === 'building' ? 'BUILDING' : 'READY', createdBy: owner } })
        await prisma.map.update({ where: { id: map.id }, data: { currentReleaseId: release.id } })
      }
    }
    const otherMap = await prisma.map.create({ data: { tenantId: otherId, name: 'Other', slug: `other-map-${suffix}`, isPublished: true } })
    const release = await prisma.publicRelease.create({ data: { mapId: otherMap.id, status: 'READY', createdBy: owner } })
    await prisma.map.update({ where: { id: otherMap.id }, data: { currentReleaseId: release.id } })
    const foreignRelease = await prisma.publicRelease.create({ data: { mapId: otherMap.id, status: 'READY', createdBy: owner } })
    await prisma.map.update({ where: { id: `foreign-${suffix}` }, data: { currentReleaseId: foreignRelease.id } })
    await prisma.mapMember.create({ data: { mapId: `published-${suffix}`, userId: editor } })
    const asset = await prisma.mediaAsset.create({ data: { tenantId, storageKey: `media-${suffix}`, originalFilename: 'fixture.png', mimeType: 'image/png', width: 100, height: 100, fileSize: 1024 } })
    await prisma.mediaVariant.create({ data: { assetId: asset.id, kind: 'thumbnail', storageKey: `variant-${suffix}`, width: 10, height: 10, fileSize: 256 } })
    await prisma.mediaAsset.create({ data: { tenantId: otherId, storageKey: `other-media-${suffix}`, originalFilename: 'fixture.png', mimeType: 'image/png', width: 100, height: 100, fileSize: 8192 } })
    vi.stubGlobal('prisma', prisma)
    vi.stubGlobal('defineEventHandler', (fn: unknown) => fn)
    vi.stubGlobal('createError', (value: object) => Object.assign(new Error(), value))
    vi.stubGlobal('requireUserSession', async () => ({ user: { id: actor, tenantId, authVersion: 1 } }))
    vi.stubGlobal('clearUserSession', vi.fn())
    vi.stubGlobal('requireTenantMember', requireTenantMember)
    vi.stubGlobal('requireTenantOwner', requireTenantOwner)
    vi.stubGlobal('setResponseHeader', vi.fn())
    vi.stubGlobal('readValidatedBody', (_event: unknown, parse: (body: unknown) => unknown) => parse(input))
    getBilling = (await import('../server/api/organization/billing/index.get')).default
    simulate = (await import('../server/api/organization/billing/simulate.post')).default
  })
  afterAll(async () => {
    vi.unstubAllGlobals()
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantId, otherId] } } })
    await prisma.user.deleteMany({ where: { id: { in: [owner, editor, inactive] } } })
  })
  it('counts own READY current releases only and actual media variants / active memberships', async () => {
    expect(await resolveWorkspaceUsage(tenantId)).toEqual({ publishedMaps: 1, retainedMaps: 7, draftMaps: 5, archivedMaps: 1, storageBytes: 1280, memberCount: 2 })
    expect(await resolveWorkspaceUsage(otherId)).toMatchObject({ publishedMaps: 1, retainedMaps: 1, storageBytes: 8192, memberCount: 0 })
    const empty = await prisma.tenant.create({ data: { name: 'Empty', slug: `empty-${suffix}` } })
    expect(await resolveWorkspaceUsage(empty.id)).toEqual({ publishedMaps: 0, retainedMaps: 0, draftMaps: 0, archivedMaps: 0, storageBytes: 0, memberCount: 0 })
    await prisma.tenant.delete({ where: { id: empty.id } })
  })
  it('allows Editor to view aggregates, rejects contract simulation and settings despite entitlements', async () => {
    actor = editor
    expect(await getBilling({} as never)).toMatchObject({ authorization: { canSimulate: false }, entitlements: { publicMap: true }, usage: { publishedMaps: 1 } })
    await expect(simulate({} as never)).rejects.toMatchObject({ statusCode: 403 })
    await expect(requireTenantOwner({} as never)).rejects.toMatchObject({ statusCode: 403 })
    actor = 'not-a-member'
    await expect(getBilling({} as never)).rejects.toMatchObject({ statusCode: 403 })
    actor = owner
  })
  it('Owner downgrade simulation preserves every Map / Release / media / membership row and current contract', async () => {
    actor = owner
    const snapshot = async () => ({
      maps: await prisma.map.findMany({ where: { tenantId }, orderBy: { id: 'asc' } }),
      releases: await prisma.publicRelease.findMany({ where: { map: { tenantId } }, orderBy: { id: 'asc' } }),
      media: await prisma.mediaAsset.findMany({ where: { tenantId }, orderBy: { id: 'asc' } }),
      members: await prisma.tenantMember.findMany({ where: { tenantId }, orderBy: { id: 'asc' } }),
    })
    const before = await snapshot()
    expect(await simulate({} as never)).toMatchObject({ persisted: false, overLimit: true, existingPublishedMapsPreserved: true, canIncreasePublishedMaps: false })
    expect(await snapshot()).toEqual(before)
    expect(await getBilling({} as never)).toMatchObject({ contract: { workspaceId: tenantId, planCode: 'STANDARD', status: 'beta' }, authorization: { canSimulate: true } })
  })
})
