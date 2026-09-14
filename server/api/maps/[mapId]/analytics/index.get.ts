export default defineEventHandler(async (event) => {
  const { map } = await requireMapAccess(event)
  const query = getQuery(event)
  const end = typeof query.end === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(query.end) ? new Date(`${query.end}T00:00:00Z`) : new Date()
  const start = typeof query.start === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(query.start) ? new Date(`${query.start}T00:00:00Z`) : new Date(end.getTime() - 29 * 86_400_000)
  if (start > end || end.getTime() - start.getTime() > 366 * 86_400_000) throw createError({ statusCode: 422, statusMessage: '日付範囲を確認してください。' })
  const [daily, spots] = await Promise.all([
    prisma.mapDailyAnalytics.findMany({ where: { tenantId: map.tenantId, mapId: map.id, date: { gte: start, lte: end } }, orderBy: { date: 'asc' } }),
    prisma.spotDailyAnalytics.groupBy({ by: ['spotId'], where: { tenantId: map.tenantId, mapId: map.id, date: { gte: start, lte: end } }, _sum: { viewCount: true }, orderBy: { _sum: { viewCount: 'desc' } }, take: 20 }),
  ])
  const spotNames = await prisma.spot.findMany({ where: { id: { in: spots.map(spot => spot.spotId) }, floor: { mapId: map.id } }, select: { id: true, name: true } })
  const names = new Map(spotNames.map(spot => [spot.id, spot.name]))
  return {
    timezone: 'UTC', displayTimezone: 'Asia/Tokyo',
    daily: daily.map(item => ({ date: item.date.toISOString().slice(0, 10), viewCount: item.viewCount })),
    totalViews: daily.reduce((sum, item) => sum + item.viewCount, 0),
    topSpots: spots.map(item => ({ spotId: item.spotId, name: names.get(item.spotId) ?? '削除済みSpot', viewCount: item._sum.viewCount ?? 0 })),
  }
})
