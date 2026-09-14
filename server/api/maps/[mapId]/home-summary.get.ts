import { buildPublicMapUrl } from '~~/shared/utils/public-url'
import type { MapHomeActionKind, MapHomeSummaryResponse } from '~~/shared/types/map-home'

const activityLabels: Record<string, string> = {
  MAP_PUBLISHED: 'MAPを公開しました',
  MAP_UNPUBLISHED: 'MAPを非公開にしました',
  MAP_RELEASE_ROLLED_BACK: '公開リリースを切り替えました',
  SPOT_REVISION_SUBMITTED: 'Spotの変更が承認待ちになりました',
  SPOT_REVISION_APPROVED: 'Spotの変更を承認しました',
  SPOT_REVISION_REJECTED: 'Spotの変更を却下しました',
  SPOT_CSV_BULK_APPLIED: 'CSVでSpotを一括更新しました',
  SPOT_PUBLISHED: 'Spotを公開しました',
  SPOT_UNPUBLISHED: 'Spotを非公開にしました',
  SPOT_DELETED: 'Spotを削除しました',
  FLOOR_DELETED: 'フロアを削除しました',
  CATEGORY_DELETED: 'Categoryを削除しました',
  DECORATION_DELETED: 'Decorationを削除しました',
  SPOT_EDITOR_ASSIGNED: 'Spot担当者を設定しました',
  SPOT_EDITOR_REPLACED: 'Spot担当者を変更しました',
  SPOT_EDITOR_REMOVED: 'Spot担当者を解除しました',
  MAP_EDITOR_ASSIGNED: 'Map編集者を設定しました',
  MAP_EDITOR_REMOVED: 'Map編集者を解除しました',
}

function homeAction(kind: MapHomeActionKind, label: string, description: string, to: string, count: number | null = null) {
  return { kind, label, description, to, count }
}

export default defineEventHandler(async (event): Promise<MapHomeSummaryResponse> => {
  const { map: accessibleMap, isOwner } = await requireMapAccess(event)
  const rawDays = Number(getQuery(event).days)
  const days = Number.isInteger(rawDays) && rawDays >= 1 && rawDays <= 90 ? rawDays : 30
  const now = new Date()
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const analyticsStart = new Date(todayUtc.getTime() - (days - 1) * 86_400_000)
  const allowedActivityActions = Object.keys(activityLabels)

  const [map, spotCount, unpositionedSpotCount, pendingRevisionCount, analytics, recentEvents] = await Promise.all([
    prisma.map.findUnique({
      where: { id: accessibleMap.id },
      select: {
        id: true,
        name: true,
        slug: true,
        isPublished: true,
        currentReleaseId: true,
        currentRelease: { select: { readyAt: true } },
        _count: { select: { floors: true } },
      },
    }),
    prisma.spot.count({ where: { floor: { mapId: accessibleMap.id } } }),
    prisma.spot.count({ where: { floor: { mapId: accessibleMap.id }, OR: [{ x: null }, { y: null }] } }),
    prisma.spotRevision.count({ where: { status: 'PENDING', spot: { floor: { mapId: accessibleMap.id } } } }),
    prisma.mapDailyAnalytics.aggregate({
      where: { tenantId: accessibleMap.tenantId, mapId: accessibleMap.id, date: { gte: analyticsStart, lte: todayUtc } },
      _sum: { viewCount: true },
    }),
    prisma.auditEvent.findMany({
      where: { tenantId: accessibleMap.tenantId, mapId: accessibleMap.id, action: { in: allowedActivityActions } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 5,
      select: { id: true, action: true, targetType: true, createdAt: true, actorUser: { select: { displayName: true } } },
    }),
  ])

  if (!map) throw createError({ statusCode: 404, statusMessage: 'マップが見つかりません。' })

  const nextActions = []
  if (map._count.floors === 0) {
    nextActions.push(homeAction('add-floor', 'フロア・イラストを登録', '公開やSpot配置の前に、MAPの土台を用意します。', `/admin/maps/${map.id}/floors`))
  }
  else if (spotCount === 0) {
    nextActions.push(homeAction('add-spot', '最初のSpotを登録', 'MAPに掲載する場所や施設を追加します。', `/admin/maps/${map.id}/spots/new`))
  }
  if (unpositionedSpotCount > 0) {
    nextActions.push(homeAction('position-spots', `${unpositionedSpotCount}件のSpotを配置`, '位置未設定のSpotをイラスト上に配置します。', `/admin/maps/${map.id}/spots?position=unpositioned`, unpositionedSpotCount))
  }
  if (pendingRevisionCount > 0) {
    nextActions.push(homeAction('review-revisions', `${pendingRevisionCount}件の変更を確認`, 'Spot担当者から届いた変更を確認します。', `/admin/maps/${map.id}/revisions`, pendingRevisionCount))
  }
  if (!map.isPublished || !map.currentReleaseId) {
    nextActions.push(homeAction('publish-map', '公開の準備を確認', '公開状態と共有URLを確認します。', `/admin/maps/${map.id}/publish`))
  }

  const hasUsablePublicRelease = Boolean(map.isPublished && map.currentReleaseId && map.currentRelease?.readyAt)
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  return {
    map: {
      id: map.id,
      name: map.name,
      slug: map.slug,
      isPublished: map.isPublished,
      currentReleaseId: map.currentReleaseId,
      lastPublishedAt: map.currentRelease?.readyAt?.toISOString() ?? null,
      publicUrl: hasUsablePublicRelease ? buildPublicMapUrl(String(useRuntimeConfig(event).publicBaseUrl), map.slug) : null,
    },
    permissions: { isOwner, canReview: true, canManageEditors: isOwner },
    metrics: {
      spotCount,
      unpositionedSpotCount,
      pendingRevisionCount,
      recentMapViews: analytics._sum.viewCount ?? 0,
      analyticsDays: days,
    },
    nextActions: nextActions.slice(0, 4),
    recentActivity: recentEvents.map(item => ({
      id: item.id,
      action: item.action,
      label: activityLabels[item.action]!,
      actorLabel: item.actorUser?.displayName || 'メンバー',
      createdAt: item.createdAt.toISOString(),
      targetType: item.targetType,
    })),
  }
})

