import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { planSpotBulk } from '../server/utils/spot-bulk'
import type { SpotBulkInput } from '../shared/schemas/spot-bulk'
const map = { id: 'map-a', tenantId: 'tenant-a' }
const category = { id: 'category-a', name: '展示', pinDefaultRevision: 0, pinDefaultType: null }
const spot = () => ({ id: 'spot-a', name: 'A', floorId: 'floor-a', floor: { name: '1F' }, x: null, y: null, lat: null, lng: null, isPublished: false, liveVersion: 1, pinSourceMode: 'individual', pinSourceCategoryId: null, pinSourceCategory: null, spotCategories: [{ categoryId: category.id, category }], pinIconType: 'preset', pinIconId: null, pinIconImageUrl: null, pinIconAssetId: null, pinColor: '#C7401F', pinSize: 'medium' })
const tx = { spot: { findMany: vi.fn(), update: vi.fn(), delete: vi.fn() }, spotCategory: { createMany: vi.fn(), deleteMany: vi.fn() }, category: { findMany: vi.fn() }, mapFloor: { findFirst: vi.fn() }, auditEvent: { create: vi.fn() } }
let input: unknown
let handler: (event: unknown) => Promise<unknown>
async function plan(command: SpotBulkInput) { return planSpotBulk(tx as never, map, command) }
async function reviewed(command: SpotBulkInput) { input = { ...command, reviewToken: (await plan(command)).token } }
describe('atomic reviewed Spot bulk API', () => {
  beforeAll(async () => {
    vi.stubGlobal('defineEventHandler', (fn: unknown) => fn)
    vi.stubGlobal('createError', (value: object) => Object.assign(new Error(), value))
    vi.stubGlobal('requireOwnedMap', async () => ({ map, session: { user: { id: 'actor' } } }))
    vi.stubGlobal('readBody', async () => input)
    vi.stubGlobal('appendAuditEvent', async () => {})
    vi.stubGlobal('prisma', { $transaction: async (fn: (client: unknown) => unknown) => fn(tx) })
    handler = (await import('../server/api/maps/[mapId]/spots/bulk.patch')).default as never
  })
  beforeEach(() => {
    vi.clearAllMocks()
    tx.spot.findMany.mockResolvedValue([spot()])
    tx.category.findMany.mockResolvedValue([category])
    tx.mapFloor.findFirst.mockResolvedValue({ id: 'floor-b', name: '2F' })
  })
  afterAll(() => vi.unstubAllGlobals())
  it('bounds commands, requires review and authorizes every ID inside transaction', async () => {
    input = { action: 'unpublish', spotIds: ['spot-a'] }
    await expect(handler({})).rejects.toMatchObject({ statusCode: 409 })
    input = { action: 'unpublish', spotIds: ['spot-a', 'cross-map'], reviewToken: 'a'.repeat(64) }
    await expect(handler({})).rejects.toMatchObject({ statusCode: 404 })
    expect(tx.spot.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: { in: ['cross-map', 'spot-a'] }, tenantId: map.tenantId, floor: { mapId: map.id } } }))
    expect(tx.spot.update).not.toHaveBeenCalled()
  })
  it('reports no-op membership adds without bumping versions or deleting other memberships', async () => {
    await reviewed({ action: 'addCategory', spotIds: ['spot-a', 'spot-a'], categoryId: category.id })
    await expect(handler({})).resolves.toEqual({ updatedCount: 0, unchangedCount: 1, total: 1 })
    expect(tx.spot.update).not.toHaveBeenCalled(); expect(tx.spotCategory.deleteMany).not.toHaveBeenCalled()
  })
  it('blocks removing an active or retained source reference', async () => {
    tx.spot.findMany.mockResolvedValue([{ ...spot(), pinSourceCategoryId: category.id }])
    await reviewed({ action: 'removeCategory', spotIds: ['spot-a'], categoryId: category.id })
    await expect(handler({})).rejects.toMatchObject({ statusCode: 409 })
    expect(tx.spotCategory.deleteMany).not.toHaveBeenCalled()
  })
  it('rejects any coordinate or eligibility on Floor assignment, even same Floor', async () => {
    for (const change of [{ x: 0 }, { y: 0 }, { lat: 0 }, { lng: 0 }, { isPublished: true }]) {
      tx.spot.findMany.mockResolvedValue([{ ...spot(), ...change }])
      await reviewed({ action: 'assignFloor', spotIds: ['spot-a'], floorId: 'floor-b' })
      await expect(handler({})).rejects.toMatchObject({ statusCode: 409 })
    }
    expect(tx.spot.update).not.toHaveBeenCalled()
  })
  it('assigns only floorId and version, never coordinates', async () => {
    await reviewed({ action: 'assignFloor', spotIds: ['spot-a'], floorId: 'floor-b' })
    await expect(handler({})).resolves.toMatchObject({ updatedCount: 1 })
    expect(tx.spot.update).toHaveBeenCalledWith({ where: { id: 'spot-a', liveVersion: 1 }, data: { floorId: 'floor-b', liveVersion: { increment: 1 } } })
  })
  it('requires a complete position for target on', async () => {
    await reviewed({ action: 'publish', spotIds: ['spot-a'] })
    await expect(handler({})).rejects.toMatchObject({ statusCode: 409 })
    expect(tx.spot.update).not.toHaveBeenCalled()
  })
  it('does not choose a source by category order and does not implicitly add memberships', async () => {
    tx.spot.findMany.mockResolvedValue([{ ...spot(), spotCategories: [] }])
    expect((await plan({ action: 'pinSource', spotIds: ['spot-a'], mode: 'soleCategory' })).rows[0]?.error).toBeTruthy()
    tx.spot.findMany.mockResolvedValue([{ ...spot(), spotCategories: [{ categoryId: 'a' }, { categoryId: 'b' }] }])
    expect((await plan({ action: 'pinSource', spotIds: ['spot-a'], mode: 'soleCategory' })).rows[0]?.error).toBeTruthy()
    expect((await plan({ action: 'pinSource', spotIds: ['spot-a'], mode: 'category', categoryId: category.id })).rows[0]?.error).toBeTruthy()
  })
  it('freezes resolved appearance and clears retained source without modifying importance or coordinates', async () => {
    tx.spot.findMany.mockResolvedValue([{ ...spot(), pinSourceMode: 'category', pinSourceCategoryId: category.id, pinSourceCategory: { ...category, pinDefaultType: 'preset', pinDefaultIconId: 'kanji:●', pinDefaultColor: '#2563EB', pinDefaultSize: 'large' } }])
    const result = await plan({ action: 'pinSource', spotIds: ['spot-a'], mode: 'individual' })
    expect(result.rows[0]?.data).toMatchObject({ pinSourceMode: 'individual', pinSourceCategoryId: null, pinColor: '#2563EB', pinSize: 'large' })
    expect(result.rows[0]?.data).not.toHaveProperty('importance')
    expect(result.rows[0]?.data).not.toHaveProperty('x')
  })
  it('rejects changed Spot versions and changed Category defaults after review', async () => {
    await reviewed({ action: 'pinSource', spotIds: ['spot-a'], mode: 'category', categoryId: category.id })
    tx.spot.findMany.mockResolvedValue([{ ...spot(), liveVersion: 2 }])
    await expect(handler({})).rejects.toMatchObject({ statusCode: 409 })
    tx.spot.findMany.mockResolvedValue([spot()]); tx.category.findMany.mockResolvedValue([{ ...category, pinDefaultRevision: 1 }])
    await expect(handler({})).rejects.toMatchObject({ statusCode: 409 })
    expect(tx.spot.update).not.toHaveBeenCalled()
  })
  it('returns conflict on serialization failure instead of success', async () => {
    await reviewed({ action: 'assignFloor', spotIds: ['spot-a'], floorId: 'floor-b' })
    tx.spot.update.mockRejectedValueOnce({ code: 'P2034' })
    await expect(handler({})).rejects.toMatchObject({ statusCode: 409 })
  })
})
