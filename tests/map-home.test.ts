import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireMapAccess: vi.fn(),
  mapFindUnique: vi.fn(),
  spotCount: vi.fn(),
  revisionCount: vi.fn(),
  analyticsAggregate: vi.fn(),
  auditFindMany: vi.fn(),
  setResponseHeader: vi.fn(),
}))

type Handler = (event: unknown) => Promise<any>
let handler: Handler

describe('WU-41 Map Home summary', () => {
  beforeAll(async () => {
    vi.stubGlobal('defineEventHandler', (value: Handler) => value)
    vi.stubGlobal('requireMapAccess', mocks.requireMapAccess)
    vi.stubGlobal('getQuery', () => ({ days: '30' }))
    vi.stubGlobal('useRuntimeConfig', () => ({ publicBaseUrl: 'https://maps.example.test' }))
    vi.stubGlobal('setResponseHeader', mocks.setResponseHeader)
    vi.stubGlobal('createError', (input: { statusCode: number, statusMessage: string }) => Object.assign(new Error(input.statusMessage), input))
    vi.stubGlobal('prisma', {
      map: { findUnique: mocks.mapFindUnique },
      spot: { count: mocks.spotCount },
      spotRevision: { count: mocks.revisionCount },
      mapDailyAnalytics: { aggregate: mocks.analyticsAggregate },
      auditEvent: { findMany: mocks.auditFindMany },
    })
    handler = (await import('../server/api/maps/[mapId]/home-summary.get')).default as Handler
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireMapAccess.mockResolvedValue({ map: { id: 'map-a', tenantId: 'tenant-a' }, isOwner: false })
    mocks.mapFindUnique.mockResolvedValue({
      id: 'map-a', name: '有松MAP', slug: 'arimatsu', isPublished: true, currentReleaseId: 'release-a',
      currentRelease: { readyAt: new Date('2026-09-14T08:00:00Z') }, _count: { floors: 2 },
    })
    mocks.spotCount.mockResolvedValueOnce(12).mockResolvedValueOnce(2)
    mocks.revisionCount.mockResolvedValue(3)
    mocks.analyticsAggregate.mockResolvedValue({ _sum: { viewCount: 99 } })
    mocks.auditFindMany.mockResolvedValue([{ id: 'audit-a', action: 'SPOT_REVISION_SUBMITTED', targetType: 'SpotRevision', createdAt: new Date('2026-09-15T00:00:00Z'), actorUser: { displayName: null } }])
  })
  afterAll(() => vi.unstubAllGlobals())

  it('assigned Map EDITORへ固定本数のMap限定集計と安全なactivityを返す', async () => {
    const result = await handler({})
    expect(mocks.requireMapAccess).toHaveBeenCalledOnce()
    expect(mocks.spotCount).toHaveBeenCalledTimes(2)
    expect(mocks.revisionCount).toHaveBeenCalledOnce()
    expect(mocks.analyticsAggregate).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-a', mapId: 'map-a' }) }))
    expect(mocks.auditFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ tenantId: 'tenant-a', mapId: 'map-a' }),
      take: 5,
      select: expect.not.objectContaining({ metadata: expect.anything() }),
    }))
    expect(result.metrics).toMatchObject({ spotCount: 12, unpositionedSpotCount: 2, pendingRevisionCount: 3, recentMapViews: 99 })
    expect(result.map.publicUrl).toBe('https://maps.example.test/arimatsu')
    expect(result.permissions).toEqual({ isOwner: false, canReview: true, canManageEditors: false })
    expect(result.recentActivity[0]).toMatchObject({ actorLabel: 'メンバー', label: 'Spotの変更が承認待ちになりました' })
    expect(JSON.stringify(result)).not.toContain('metadata')
    expect(mocks.setResponseHeader).toHaveBeenCalledWith({}, 'Cache-Control', 'private, no-store')
  })

  it.each(['unassigned Map EDITOR', 'cross-Tenant user'])('%sは共通Map guardで拒否する', async () => {
    mocks.requireMapAccess.mockRejectedValueOnce(Object.assign(new Error('not found'), { statusCode: 404 }))
    await expect(handler({})).rejects.toMatchObject({ statusCode: 404 })
    expect(mocks.mapFindUnique).not.toHaveBeenCalled()
  })

  it('利用可能なreleaseがなければ公開URLを返さず、公開確認actionを返す', async () => {
    mocks.mapFindUnique.mockResolvedValueOnce({ id: 'map-a', name: '下書きMAP', slug: 'draft', isPublished: false, currentReleaseId: null, currentRelease: null, _count: { floors: 1 } })
    const result = await handler({})
    expect(result.map.publicUrl).toBeNull()
    expect(result.nextActions.map((item: any) => item.kind)).toContain('publish-map')
  })
})

