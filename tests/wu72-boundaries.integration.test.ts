import { randomUUID } from 'node:crypto'
import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest'
import { prisma } from '../server/utils/prisma'
import { requireMapAccess, requireOwnedSpot } from '../server/utils/map-access'
import { createSpotWithUsage, detachSpotUsage } from '../server/utils/spot-usage'
import { updateWorkspaceContent } from '../server/utils/workspace-spot'
import { approveSpotRevision } from '../server/utils/spot-revision'
import { loadSpotCsvContext, createSpotCsvExport, previewSpotCsv } from '../server/utils/spot-csv'
import { AnalyticsBuffer } from '../server/utils/analytics'
const integration = process.env.DATABASE_URL ? describe : describe.skip
integration('WU72 multi-Map authorization, retention and compatibility', () => {
  const id = randomUUID(), tenantId = `t-${id}`, a = `a-${id}`, b = `b-${id}`, f = `f-${id}`, f2 = `f2-${id}`, fb = `fb-${id}`, s = `s-${id}`, owner = `o-${id}`, editor = `e-${id}`
  const field = `field-${id}`, category = `category-${id}`
  let userId = editor, routeMap = a
  beforeAll(async () => {
    if (!/digital_map_(test_|ci)/.test(new URL(process.env.DATABASE_URL!).pathname)) throw Error('Disposable DB required')
    await prisma.tenant.create({ data: { id: tenantId, name: 'Workspace', slug: tenantId } })
    await prisma.map.createMany({ data: [a,b].map(id => ({ id, name: id, slug: id, tenantId })) })
    await prisma.mapFloor.createMany({ data: [{ id: f, mapId: a }, { id: f2, mapId: a }, { id: fb, mapId: b }].map(value => ({ ...value, name: value.id, illustrationUrl: '/fixture.png', imageWidth: 100, imageHeight: 100 })) })
    await prisma.user.createMany({ data: [owner, editor].map(id => ({ id, email: `${id}@example.invalid`, passwordHash: 'test' })) })
    await prisma.tenantMember.createMany({ data: [{ tenantId, userId: owner, role: 'OWNER' }, { tenantId, userId: editor, role: 'MEMBER' }] })
    await prisma.mapMember.create({ data: { mapId: a, userId: editor } })
    await prisma.category.create({ data: { id: category, tenantId, mapId: a, name: 'Exhibit' } })
    await prisma.spotFieldDefinition.create({ data: { id: field, mapId: a, kind: 'custom', label: 'Code', type: 'single_line_text' } })
    await prisma.$transaction(tx => createSpotWithUsage(tx, { data: { id: s, tenantId, floorId: f, name: 'Canonical', description: 'body', x: .2, y: .3, liveVersion: 7, contentVersion: 7, spotCategories: { create: { categoryId: category } }, fieldValues: { create: { fieldDefinitionId: field, valueJson: 'original' } } } }))
    vi.stubGlobal('prisma', prisma)
    vi.stubGlobal('requireUser', async () => ({ user: { id: userId, tenantId } }))
    vi.stubGlobal('getRouterParam', (_: unknown, key: string) => key === 'mapId' ? routeMap : s)
    vi.stubGlobal('createError', (value: object) => Object.assign(new Error(), value))
  })
  afterAll(async () => {
    vi.unstubAllGlobals()
    // Audit is append-only. Retain this UUID fixture until the disposable DB is dropped.
  })
  it('Map ACL does not grant another Map in the same Workspace', async () => {
    await expect(requireMapAccess({} as never)).resolves.toMatchObject({ map: { id: a } })
    routeMap = b
    await expect(requireMapAccess({} as never)).rejects.toMatchObject({ statusCode: 404 })
    userId = owner
    await expect(requireMapAccess({} as never)).resolves.toMatchObject({ map: { id: b } })
    await expect(requireOwnedSpot({} as never)).rejects.toMatchObject({ statusCode: 404 })
    userId = editor; routeMap = a
  })
  it('rejects cross-Map Category sharing, consumer transfer and placement', async () => {
    await expect(prisma.mapCategoryUsage.create({ data: { mapId: b, categoryId: category } })).rejects.toThrow()
    await expect(prisma.category.update({ where: { id: category }, data: { mapId: b } })).rejects.toThrow()
    await expect(prisma.mapSpotUsage.update({ where: { spotId: s }, data: { mapId: b } })).rejects.toThrow()
    await expect(prisma.illustrationPlacement.create({ data: { usageId: `usage_${s}`, floorId: fb, x: .5, y: .5 } })).rejects.toThrow()
    const wrongField = await prisma.spotFieldDefinition.create({ data: { mapId: b, kind: 'custom', label: 'Code', type: 'single_line_text' } })
    await expect(prisma.spotFieldValue.create({ data: { spotId: s, fieldDefinitionId: wrongField.id, valueJson: 'forbidden' } })).rejects.toThrow()
  })
  it('keeps CSV canonical rows and custom definition IDs through added occurrences', async () => {
    await prisma.illustrationPlacement.createMany({ data: [1,2].map(() => ({ usageId: `usage_${s}`, floorId: f2, x: .6, y: .7 })) })
    const context = await loadSpotCsvContext(prisma, a)
    expect(context.spots).toHaveLength(1)
    expect(context.spots[0]!.id).toBe(s)
    const csv = createSpotCsvExport(context)
    const preview = previewSpotCsv(csv, context.fields, context.categories, context.existingNames, context.enabledLocales, context.spots, undefined, context.floors)
    expect(preview.preview).toMatchObject({ total: 1, unchangedCount: 1, errors: 0, conflicts: 0 })
    expect(context.spots[0]!.fieldValues[0]).toMatchObject({ fieldDefinitionId: field, valueJson: 'original' })
  })
  it('aggregates canonical analytics and rejects other-Map or occurrence identities', async () => {
    for (const mapId of [a,b]) {
      const release = await prisma.publicRelease.create({ data: { mapId, createdBy: owner, status: 'READY' } })
      await prisma.map.update({ where: { id: mapId }, data: { currentReleaseId: release.id, isPublished: true } })
    }
    const buffer = new AnalyticsBuffer(prisma)
    buffer.enqueue({ type: 'SPOT_VIEW', mapId: a, spotId: s })
    buffer.enqueue({ type: 'SPOT_VIEW', mapId: b, spotId: s })
    buffer.enqueue({ type: 'SPOT_VIEW', mapId: a, spotId: `placement_${s}` })
    expect(await buffer.flush()).toBe(1)
    expect(await prisma.spotDailyAnalytics.findFirstOrThrow({ where: { spotId: s } })).toMatchObject({ mapId: a, viewCount: 1 })
  })
  it('retains IDs, pending revisions, assignments and schema after Map removal of content', async () => {
    await prisma.spotEditorAssignment.create({ data: { spotId: s, userId: editor, assignedById: owner } })
    const payload = { name: 'Approved', description: 'body', address: null, phone: null, website: null, hoursText: null, holidayText: null, fieldValues: [{ fieldDefinitionId: field, valueJson: 'approved' }], photoAssetIds: [] }
    const revision = await prisma.spotRevision.create({ data: { spotId: s, authorId: editor, baseVersion: 7, payload } })
    const current = await prisma.spot.findUniqueOrThrow({ where: { id: s } })
    await prisma.$transaction(tx => detachSpotUsage(tx, s, a, current.liveVersion))
    const spot = await prisma.spot.findUniqueOrThrow({ where: { id: s }, include: { mapUsage: true, revisions: true, editorAssignment: true, fieldValues: true } })
    expect(spot).toMatchObject({ id: s, name: 'Canonical', schemaMapId: a, stewardMapId: null, floorId: null, mapUsage: null, contentVersion: 7 })
    expect(spot.editorAssignment?.userId).toBe(editor)
    expect(spot.revisions).toHaveLength(1)
    expect(spot.fieldValues[0]!.valueJson).toBe('original')
    await expect(prisma.mapSpotUsage.create({ data: { spotId: s, mapId: b } })).rejects.toThrow()
    await expect(requireOwnedSpot({} as never)).rejects.toMatchObject({ statusCode: 404 })
    const session = { user: { id: owner, tenantId } } as never
    await approveSpotRevision({} as never, revision.id, { session, map: { id: a, tenantId }, isOwner: true, canonicalSpotId: s })
    expect((await prisma.spot.findUniqueOrThrow({ where: { id: s } })).name).toBe('Approved')
    const context = { session, spot: { ...spot, contentVersion: 8 } } as never
    const { fieldValues: _fields, photoAssetIds: _photos, ...content } = payload
    await expect(prisma.$transaction(tx => updateWorkspaceContent(tx, context, { expectedContentVersion: 7, ...content, customValues: {} }))).rejects.toMatchObject({ code: 'P2025' })
    await prisma.$transaction(tx => updateWorkspaceContent(tx, context, { expectedContentVersion: 8, ...content, customValues: { [field]: 'owner edit' } }))
    expect((await prisma.spotFieldValue.findFirstOrThrow({ where: { spotId: s } })).valueJson).toBe('owner edit')
    expect(await prisma.mapSpotUsage.count({ where: { spotId: s } })).toBe(0)
  })
  it('archiving a Map preserves canonical content/schema and denies Map ACL', async () => {
    const before = await prisma.spot.findUniqueOrThrow({ where: { id: s }, include: { fieldValues: true, revisions: true } })
    await prisma.map.update({ where: { id: a }, data: { archivedAt: new Date(), isPublished: false } })
    userId = owner
    await expect(requireMapAccess({} as never)).rejects.toMatchObject({ statusCode: 404 })
    expect(await prisma.spot.findUniqueOrThrow({ where: { id: s }, include: { fieldValues: true, revisions: true } })).toEqual(before)
    expect(await prisma.spotFieldDefinition.count({ where: { mapId: a } })).toBe(1)
  })
})
