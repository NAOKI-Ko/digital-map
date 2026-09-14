import { readFileSync } from 'node:fs'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const mockPrisma = {
  map: { findMany: vi.fn() },
  spot: { findMany: vi.fn() },
  mapDailyAnalytics: { upsert: vi.fn() },
  spotDailyAnalytics: { upsert: vi.fn() },
  $transaction: vi.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
}
vi.stubGlobal('prisma', mockPrisma)

let AnalyticsBuffer: typeof import('../server/utils/analytics').AnalyticsBuffer
let consumeAnalyticsRateLimit: typeof import('../server/utils/analytics').consumeAnalyticsRateLimit

beforeAll(async () => ({ AnalyticsBuffer, consumeAnalyticsRateLimit } = await import('../server/utils/analytics')))
beforeEach(() => {
  vi.clearAllMocks()
  mockPrisma.map.findMany.mockResolvedValue([{ id: 'map-a', tenantId: 'tenant-a' }])
  mockPrisma.spot.findMany.mockResolvedValue([{ id: 'spot-a', floor: { mapId: 'map-a', map: { tenantId: 'tenant-a' } } }])
  mockPrisma.mapDailyAnalytics.upsert.mockResolvedValue({})
  mockPrisma.spotDailyAnalytics.upsert.mockResolvedValue({})
})

describe('privacy-light analytics', () => {
  it('複数eventをUTC日次counterへまとめ、eventごとにDB writeしない', async () => {
    const buffer = new AnalyticsBuffer(mockPrisma as any, 100)
    for (let index = 0; index < 10; index++) buffer.enqueue({ type: 'MAP_VIEW', mapId: 'map-a' }, new Date('2026-09-14T23:30:00Z'))
    expect(mockPrisma.mapDailyAnalytics.upsert).not.toHaveBeenCalled()
    await buffer.flush()
    expect(mockPrisma.mapDailyAnalytics.upsert).toHaveBeenCalledTimes(1)
    expect(mockPrisma.mapDailyAnalytics.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ viewCount: 10, tenantId: 'tenant-a' }) }))
  })

  it('SpotとMapの対応をbatch検証し、不一致eventを数えない', async () => {
    mockPrisma.spot.findMany.mockResolvedValue([{ id: 'spot-a', floor: { mapId: 'map-other', map: { tenantId: 'tenant-a' } } }])
    const buffer = new AnalyticsBuffer(mockPrisma as any)
    buffer.enqueue({ type: 'SPOT_VIEW', mapId: 'map-a', spotId: 'spot-a' })
    await buffer.flush()
    expect(mockPrisma.spotDailyAnalytics.upsert).not.toHaveBeenCalled()
  })

  it('analytics rate limitはWU-27の不可逆key frameworkを再利用する', () => {
    expect(consumeAnalyticsRateLimit('192.0.2.1', 0, 2)).toBe(true)
    expect(consumeAnalyticsRateLimit('192.0.2.1', 0, 2)).toBe(true)
    expect(consumeAnalyticsRateLimit('192.0.2.1', 0, 2)).toBe(false)
  })

  it('公開送信は非同期でMAP_VIEWをsessionStorage dedupeし、SPOT_VIEWを許可する', () => {
    const source = readFileSync(new URL('../app/utils/public-analytics.ts', import.meta.url), 'utf8')
    const page = readFileSync(new URL('../app/pages/[mapSlug]/index.vue', import.meta.url), 'utf8')
    expect(source).toContain('sessionStorage.getItem')
    expect(source).toContain('navigator.sendBeacon')
    expect(source).toContain('keepalive: true')
    expect(page).toContain("type: 'SPOT_VIEW'")
    expect(page).toContain('recordMapViewOnce')
  })

  it('raw event/IP/cookie識別子を永続化せず、admin previewは計測しない', () => {
    const schema = readFileSync(new URL('../prisma/schema.prisma', import.meta.url), 'utf8')
    const endpoint = readFileSync(new URL('../server/api/analytics/index.post.ts', import.meta.url), 'utf8')
    expect(schema).not.toMatch(/model AnalyticsEvent/)
    expect(schema).not.toMatch(/MapDailyAnalytics[\s\S]{0,500}\bip\b/i)
    expect(endpoint).not.toContain('requestIP:')
    expect(endpoint).toContain('botPattern')
    expect(readFileSync(new URL('../app/pages/admin/maps/[mapId]/analytics.vue', import.meta.url), 'utf8')).not.toContain('sendPublicAnalytics')
  })

  it('dashboard APIはMap accessとtenant/map filtersを強制する', () => {
    const source = readFileSync(new URL('../server/api/maps/[mapId]/analytics/index.get.ts', import.meta.url), 'utf8')
    expect(source).toContain('requireMapAccess(event)')
    expect(source).toContain('tenantId: map.tenantId')
    expect(source).toContain('mapId: map.id')
  })
})
