import { describe, expect, it, vi, afterAll } from 'vitest'
import { parseCsv, encodeCsv } from '../lib/csv'
import { createSpotCsvStarter, createSpotCsvExport, computeSpotCsvSchemaVersion, previewSpotCsv } from '../server/utils/spot-csv'
import { spotPhotoCount } from '../shared/utils/spot-operations'

const fields = [{ id: 'description', kind: 'standard', semanticKey: 'description', label: '展示の説明', type: 'multiline_text', enabled: true, required: false, order: 0 }]
const floors = Array.from({ length: 5 }, (_, index) => ({ id: `floor-${index}`, name: `館内${index + 1}F`, order: index }))
const categories = [{ id: 'exhibit', name: '展示' }, { id: 'rest', name: '休憩' }]
const context = { fields, floors, categories, spots: [], existingNames: [], enabledLocales: ['ja'], schemaVersion: computeSpotCsvSchemaVersion(fields, ['ja'], floors) }

describe('WU-65 structured setup', () => {
  it('creates 37 new rows from a zero-Spot starter without authoring internal identities', () => {
    const [headers, starter] = parseCsv(createSpotCsvStarter(context)).rows
    const rows = Array.from({ length: 37 }, (_, index) => {
      const row = [...starter!]
      row[headers!.indexOf('スポット名')] = `展示${index + 1}`
      row[headers!.indexOf('フロア')] = floors[index % floors.length]!.name
      row[headers!.indexOf('カテゴリー')] = index % 2 ? '展示' : '展示|休憩'
      return row
    })
    const result = previewSpotCsv(encodeCsv([headers!, ...rows]), fields, categories, [], ['ja'], [], undefined, floors)
    expect(result.preview).toMatchObject({ version: 3, total: 37, newCount: 37, errors: 0, conflicts: 0 })
    expect(result.parsedRows[0]).toMatchObject({ floorId: 'floor-0', categoryIds: ['exhibit', 'rest'], spotId: null })
    expect(rows.every(row => row[headers!.indexOf('__spotId')] === '' && row[headers!.indexOf('__rowVersion')] === '')).toBe(true)
    expect(parseCsv(createSpotCsvExport(context)).rows).toHaveLength(1)
  })
  it('does not import an unfilled starter as a fake Spot and still rejects ambiguous Floors', () => {
    expect(previewSpotCsv(createSpotCsvStarter(context), fields, categories, [], ['ja'], [], undefined, floors).preview.errors).toBeGreaterThan(0)
    const ambiguousFloors = [...floors, { id: 'other', name: floors[0]!.name, order: 6 }]
    const ambiguousContext = { ...context, floors: ambiguousFloors, schemaVersion: computeSpotCsvSchemaVersion(fields, ['ja'], ambiguousFloors) }
    const rows = parseCsv(createSpotCsvStarter(ambiguousContext)).rows
    rows[1]![0] = floors[0]!.name
    rows[1]![1] = '展示'
    expect(previewSpotCsv(encodeCsv(rows), fields, categories, [], ['ja'], [], undefined, ambiguousFloors).preview.rows[0]?.messages.some(message => message.message.includes('同名のフロア'))).toBe(true)
  })
  it('counts effective photos without adding managed and legacy copies together', () => {
    expect(spotPhotoCount(['/uploads/a.jpg', '/uploads/b.jpg'], 2)).toBe(2)
    expect(spotPhotoCount(['/uploads/a.jpg', null], 0)).toBe(1)
    expect(spotPhotoCount(null)).toBe(0)
  })
})

describe('WU-65 list scope', () => {
  afterAll(() => vi.unstubAllGlobals())
  it('intersects keyword and unplaced filters instead of overwriting the keyword OR', async () => {
    const findMany = vi.fn().mockResolvedValue([])
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('requireOwnedMap', async () => ({ map: { id: 'map-a' } }))
    vi.stubGlobal('getQuery', () => ({ q: '展示', position: 'unpositioned', floorId: 'floor-0' }))
    vi.stubGlobal('prisma', { spot: { findMany, count: vi.fn().mockResolvedValue(0) }, mapFloor: { findMany: vi.fn().mockResolvedValue([]) }, category: { findMany: vi.fn().mockResolvedValue([]) } })
    const handler = (await import('../server/api/maps/[mapId]/spots/index.get')).default
    await handler({} as never)
    expect(findMany.mock.calls[0]![0].where).toMatchObject({
      mapUsage: { mapId: 'map-a', placements: { some: { floorId: 'floor-0' }, none: { floorId: 'floor-0', x: { not: null }, y: { not: null } } } },
      AND: [{ OR: expect.arrayContaining([{ name: { contains: '展示', mode: 'insensitive' } }]) }],
    })
  })
  it('reports Map-wide work counts independently of row filters and supports no Category', async () => {
    const findMany = vi.fn().mockResolvedValue([])
    const count = vi.fn().mockResolvedValueOnce(37).mockResolvedValueOnce(4)
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('requireOwnedMap', async () => ({ map: { id: 'map-a' } }))
    vi.stubGlobal('getQuery', () => ({ q: 'one', categoryId: 'none', floorId: 'floor-0' }))
    vi.stubGlobal('prisma', { spot: { findMany, count }, mapFloor: { findMany: vi.fn().mockResolvedValue([]) }, category: { findMany: vi.fn().mockResolvedValue([]) } })
    const handler = (await import('../server/api/maps/[mapId]/spots/index.get')).default
    const result = await handler({} as never)
    expect(result.taskCounts).toEqual({ unplaced: 37, positionedTargetOff: 4 })
    expect(findMany.mock.calls[0]![0].where.spotCategories).toEqual({ none: {} })
    for (const call of count.mock.calls) {
      expect(call[0].where).toHaveProperty('mapUsage.mapId', 'map-a')
      expect(call[0].where).not.toHaveProperty('floorId')
      expect(call[0].where).not.toHaveProperty('name')
    }
  })

})
