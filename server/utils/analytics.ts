import type { Prisma } from '~~/prisma/generated/client'
import { rateLimitKey } from './rate-limit'

export type AnalyticsEvent = { type: 'MAP_VIEW', mapId: string } | { type: 'SPOT_VIEW', mapId: string, spotId: string }
type AnalyticsClient = typeof prisma

function utcDate(value = new Date()) { return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())) }

export class AnalyticsBuffer {
  private counts = new Map<string, { event: AnalyticsEvent, date: Date, count: number }>()
  private flushing: Promise<number> | null = null
  constructor(private readonly client: AnalyticsClient, private readonly threshold = 100) {}

  enqueue(event: AnalyticsEvent, now = new Date()) {
    const date = utcDate(now)
    const key = `${event.type}:${event.mapId}:${event.type === 'SPOT_VIEW' ? event.spotId : ''}:${date.toISOString()}`
    const existing = this.counts.get(key)
    this.counts.set(key, { event, date, count: (existing?.count ?? 0) + 1 })
    if (this.size >= this.threshold) void this.flush()
  }

  get size() { return [...this.counts.values()].reduce((sum, item) => sum + item.count, 0) }
  get aggregateSize() { return this.counts.size }

  async flush() {
    if (this.flushing) return this.flushing
    if (!this.counts.size) return 0
    const batch = [...this.counts.values()]
    this.counts.clear()
    this.flushing = this.persist(batch).catch((error) => {
      for (const item of batch) for (let count = 0; count < item.count; count++) this.enqueue(item.event, item.date)
      throw error
    }).finally(() => { this.flushing = null })
    return this.flushing
  }

  private async persist(batch: Array<{ event: AnalyticsEvent, date: Date, count: number }>) {
    const mapIds = [...new Set(batch.map(item => item.event.mapId))]
    const spotIds = [...new Set(batch.flatMap(item => item.event.type === 'SPOT_VIEW' ? [item.event.spotId] : []))]
    const [maps, spots] = await Promise.all([
      this.client.map.findMany({ where: { id: { in: mapIds }, currentReleaseId: { not: null }, isPublished: true }, select: { id: true, tenantId: true } }),
      spotIds.length ? this.client.spot.findMany({ where: { id: { in: spotIds } }, select: { id: true, floor: { select: { mapId: true, map: { select: { tenantId: true } } } } } }) : [],
    ])
    const mapById = new Map(maps.map(map => [map.id, map]))
    const spotById = new Map(spots.map(spot => [spot.id, spot]))
    const operations: Prisma.PrismaPromise<unknown>[] = []
    for (const item of batch) {
      const map = mapById.get(item.event.mapId)
      if (!map) continue
      if (item.event.type === 'MAP_VIEW') operations.push(this.client.mapDailyAnalytics.upsert({
        where: { mapId_date: { mapId: map.id, date: item.date } },
        create: { tenantId: map.tenantId, mapId: map.id, date: item.date, viewCount: item.count },
        update: { viewCount: { increment: item.count } },
      }))
      else {
        const spot = spotById.get(item.event.spotId)
        if (!spot || spot.floor.mapId !== map.id) continue
        operations.push(this.client.spotDailyAnalytics.upsert({
          where: { spotId_date: { spotId: spot.id, date: item.date } },
          create: { tenantId: map.tenantId, mapId: map.id, spotId: spot.id, date: item.date, viewCount: item.count },
          update: { viewCount: { increment: item.count } },
        }))
      }
    }
    if (operations.length) await this.client.$transaction(operations)
    return operations.length
  }
}

const publicBuckets = new Map<string, { count: number, expiresAt: number }>()
export function consumeAnalyticsRateLimit(ip: string, now = Date.now(), limit = 300) {
  const key = rateLimitKey('analytics', [ip], 60, now)
  const existing = publicBuckets.get(key)
  const count = (existing?.count ?? 0) + 1
  publicBuckets.set(key, { count, expiresAt: now + 60_000 })
  if (publicBuckets.size > 2000) for (const [bucketKey, value] of publicBuckets) if (value.expiresAt < now) publicBuckets.delete(bucketKey)
  return count <= limit
}

export const analyticsBuffer = new AnalyticsBuffer(prisma)
