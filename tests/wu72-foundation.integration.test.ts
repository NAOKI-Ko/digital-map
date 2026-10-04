import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { prisma } from '../server/utils/prisma'
import { createSpotWithUsage, updateSpotWithUsage } from '../server/utils/spot-usage'
import { refreshPrimaryProjection, reconcileUsagePublication } from '../server/utils/illustration-placement'
import { getLivePublicMapById } from '../server/utils/public-map'
import { requireOwnedSpot } from '../server/utils/map-access'
import { loadSpotCsvContext, createSpotCsvExport, previewSpotCsv } from '../server/utils/spot-csv'
import { adminSpotInclude, toAdminSpotDetail, getMapFloorOptions, getMapCategoryOptions } from '../server/utils/spot'
const enabled = Boolean(process.env.DATABASE_URL)
const integration = enabled ? describe : describe.skip
integration('WU72 content, Usage and occurrence boundaries', () => {
  const suffix = randomUUID()
  const tenantId = `wu72-${suffix}`, mapId = `map-${suffix}`, floorId = `floor-${suffix}`, secondFloorId = `floor2-${suffix}`, spotId = `spot-${suffix}`
  let primaryId: string, secondaryId: string
  beforeAll(async () => {
    if (!/digital_map_(?:test_|ci)/.test(new URL(process.env.DATABASE_URL!).pathname)) throw Error('Disposable DB only')
    await prisma.tenant.create({ data: { id: tenantId, slug: tenantId, name: 'WU72' } })
    await prisma.map.create({ data: { id: mapId, tenantId, slug: mapId, name: 'Map' } })
    await prisma.mapFloor.createMany({ data: [floorId, secondFloorId].map(id => ({ id, mapId, name: id, illustrationUrl: '/uploads/test.png', imageWidth: 100, imageHeight: 100 })) })
    await prisma.$transaction(tx => createSpotWithUsage(tx, { data: { id: spotId, tenantId, floorId, name: 'Canonical', description: 'One body', x: .2, y: .3, isPublished: true } }))
    primaryId = (await prisma.illustrationPlacement.findFirstOrThrow({ where: { usage: { spotId } } })).id
    secondaryId = (await prisma.illustrationPlacement.create({ data: { usageId: `usage_${spotId}`, floorId: secondFloorId, x: .6, y: .7 } })).id
  })
  afterAll(async () => {
    vi.unstubAllGlobals()
    await prisma.$transaction(async tx => {
      await tx.spot.updateMany({ where: { tenantId }, data: { stewardMapId: null } })
      await tx.mapSpotUsage.deleteMany({ where: { mapId } })
      await tx.tenant.delete({ where: { id: tenantId } })
    })
  })
  it('keeps IDs and creates exactly one consumer, allowing several same-Map occurrences', async () => {
    const spot = await prisma.spot.findUniqueOrThrow({ where: { id: spotId }, include: { mapUsage: { include: { placements: true } } } })
    expect(spot.stewardMapId).toBe(mapId)
    expect(spot.mapUsage?.placements).toHaveLength(2)
    await expect(prisma.mapSpotUsage.create({ data: { spotId, mapId } })).rejects.toThrow()
  })
  it('moves primary/secondary independently and does not invalidate a canonical revision', async () => {
    const before = await prisma.spot.findUniqueOrThrow({ where: { id: spotId } })
    await prisma.illustrationPlacement.update({ where: { id: secondaryId }, data: { x: .8, version: { increment: 1 } } })
    expect((await prisma.illustrationPlacement.findUniqueOrThrow({ where: { id: primaryId } })).x).toBe(.2)
    await prisma.$transaction(async tx => {
      await tx.illustrationPlacement.update({ where: { id: primaryId }, data: { x: .4, version: { increment: 1 } } })
      await refreshPrimaryProjection(tx, `usage_${spotId}`)
    })
    expect(await prisma.spot.findUniqueOrThrow({ where: { id: spotId }, select: { name: true, description: true, contentVersion: true } })).toEqual({ name: before.name, description: before.description, contentVersion: before.contentVersion })
    expect((await prisma.illustrationPlacement.findUniqueOrThrow({ where: { id: secondaryId } })).x).toBe(.8)
  })
  it('changes canonical content once while preserving all Placement coordinates', async () => {
    const positions = await prisma.illustrationPlacement.findMany({ where: { usage: { spotId } }, select: { id: true, x: true, y: true, version: true }, orderBy: { id: 'asc' } })
    await prisma.$transaction(tx => updateSpotWithUsage(tx, { where: { id: spotId }, data: { name: 'Updated canonical', liveVersion: { increment: 1 } } }))
    expect(await prisma.illustrationPlacement.findMany({ where: { usage: { spotId } }, select: { id: true, x: true, y: true, version: true }, orderBy: { id: 'asc' } })).toEqual(positions)
    const map = await getLivePublicMapById(mapId)
    const occurrences = map!.floors.flatMap(floor => floor.spots)
    expect(occurrences).toHaveLength(2)
    expect(new Set(occurrences.map(spot => spot.placementId)).size).toBe(2)
    expect(occurrences.every(spot => spot.id === spotId && spot.name === 'Updated canonical')).toBe(true)
  })
  it('publishes a positioned secondary occurrence and unpublishes after the last positioned occurrence is removed', async () => {
    await prisma.$transaction(tx => updateSpotWithUsage(tx, { where: { id: spotId }, data: { x: null, y: null, isPublished: false, liveVersion: { increment: 1 } } }))
    vi.stubGlobal('prisma', prisma)
    vi.stubGlobal('defineEventHandler', (fn: unknown) => fn)
    vi.stubGlobal('requireOwnedSpot', async () => ({ spot: await prisma.spot.findUniqueOrThrow({ where: { id: spotId } }), map: { id: mapId, tenantId }, session: { user: { id: 'test-owner' } } }))
    vi.stubGlobal('readBody', async () => ({ isPublished: true }))
    vi.stubGlobal('appendAuditEvent', async () => {})
    vi.stubGlobal('createError', (value: object) => Object.assign(new Error(), value))
    const publish = (await import('../server/api/maps/[mapId]/spots/[spotId]/publish.patch')).default
    vi.stubGlobal('requireOwnedMap', async () => ({ map: { id: mapId } }))
    vi.stubGlobal('getQuery', () => ({ floorId: secondFloorId, position: 'positioned' }))
    const list = (await import('../server/api/maps/[mapId]/spots/index.get')).default
    expect((await list({} as never)).spots.map(item => item.id)).toEqual([spotId])
    vi.stubGlobal('getQuery', () => ({ view: 'placements', floorId: secondFloorId, position: 'positioned' }))
    expect((await list({} as never)).spots.map(item => item.id)).toEqual([secondaryId])
    vi.stubGlobal('getQuery', () => ({ position: 'unpositioned' }))
    expect((await list({} as never)).spots).toEqual([])
    await expect(publish({} as never)).resolves.toMatchObject({ publication: { isPublished: true } })
    expect((await getLivePublicMapById(mapId))!.floors.flatMap(floor => floor.spots)).toHaveLength(1)
    const before = await prisma.spot.findUniqueOrThrow({ where: { id: spotId } })
    await prisma.$transaction(async tx => {
      await tx.illustrationPlacement.update({ where: { id: secondaryId }, data: { x: null, y: null, version: { increment: 1 } } })
      await reconcileUsagePublication(tx, `usage_${spotId}`)
    })
    expect(await prisma.spot.findUniqueOrThrow({ where: { id: spotId }, select: { isPublished: true, contentVersion: true } })).toEqual({ isPublished: false, contentVersion: before.contentVersion })
    expect((await prisma.mapSpotUsage.findUniqueOrThrow({ where: { spotId } })).isPublished).toBe(false)
    await prisma.$transaction(async tx => {
      await tx.illustrationPlacement.deleteMany({ where: { usageId: `usage_${spotId}` } })
      await refreshPrimaryProjection(tx, `usage_${spotId}`)
    })
    const context = await loadSpotCsvContext(prisma, mapId)
    const csv = createSpotCsvExport(context)
    expect(previewSpotCsv(csv, context.fields, context.categories, context.existingNames, context.enabledLocales, context.spots, undefined, context.floors).preview).toMatchObject({ unchangedCount: 1, errors: 0, conflicts: 0 })
    vi.stubGlobal('adminSpotInclude', adminSpotInclude)
    vi.stubGlobal('toAdminSpotDetail', toAdminSpotDetail)
    vi.stubGlobal('getMapFloorOptions', getMapFloorOptions)
    vi.stubGlobal('getMapCategoryOptions', getMapCategoryOptions)
    vi.stubGlobal('getMapSpotFieldDefinitions', async () => [])
    vi.stubGlobal('validateSpotFieldSubmission', async () => {})
    const current = await prisma.spot.findUniqueOrThrow({ where: { id: spotId } })
    vi.stubGlobal('readBody', async () => ({ floorId: '', name: 'Edited without placement', description: 'body', hoursText: '', holidayText: '', phone: '', x: null, y: null, customValues: {}, expectedVersion: current.liveVersion }))
    const edit = (await import('../server/api/maps/[mapId]/spots/[spotId]/index.patch')).default
    await expect(edit({} as never)).resolves.toMatchObject({ spot: { id: spotId, name: 'Edited without placement', floorId: '' } })
    expect(await prisma.illustrationPlacement.count({ where: { usage: { spotId } } })).toBe(0)
    vi.unstubAllGlobals()
  })
  it('requires the canonical steward for Map Editors, while Owner keeps authority', async () => {
    const userId = `user-${suffix}`
    await prisma.user.create({ data: { id: userId, email: `${suffix}@example.invalid`, passwordHash: 'test-only' } })
    await prisma.tenantMember.create({ data: { tenantId, userId, role: 'MEMBER' } })
    await prisma.mapMember.create({ data: { mapId, userId } })
    vi.stubGlobal('prisma', prisma)
    vi.stubGlobal('requireUser', async () => ({ user: { id: userId, tenantId } }))
    vi.stubGlobal('getRouterParam', (_: unknown, name: string) => name === 'mapId' ? mapId : spotId)
    vi.stubGlobal('createError', (value: object) => Object.assign(new Error(), value))
    await expect(requireOwnedSpot({} as never)).resolves.toMatchObject({ spot: { id: spotId } })
    await prisma.spot.update({ where: { id: spotId }, data: { stewardMapId: null } })
    await expect(requireOwnedSpot({} as never)).rejects.toMatchObject({ statusCode: 404 })
    await prisma.tenantMember.update({ where: { tenantId_userId: { tenantId, userId } }, data: { role: 'OWNER' } })
    await expect(requireOwnedSpot({} as never)).resolves.toMatchObject({ spot: { id: spotId } })
    await prisma.spot.update({ where: { id: spotId }, data: { stewardMapId: mapId } })
    await prisma.user.delete({ where: { id: userId } })
  })
})
