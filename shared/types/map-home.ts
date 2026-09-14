export type MapHomeActionKind = 'add-floor' | 'add-spot' | 'position-spots' | 'review-revisions' | 'publish-map'

export interface MapHomeSummaryResponse {
  map: {
    id: string
    name: string
    slug: string
    isPublished: boolean
    currentReleaseId: string | null
    lastPublishedAt: string | null
    publicUrl: string | null
  }
  permissions: {
    isOwner: boolean
    canReview: boolean
    canManageEditors: boolean
  }
  metrics: {
    spotCount: number
    unpositionedSpotCount: number
    pendingRevisionCount: number
    recentMapViews: number
    analyticsDays: number
  }
  nextActions: Array<{
    kind: MapHomeActionKind
    count: number | null
    label: string
    description: string
    to: string
  }>
  recentActivity: Array<{
    id: string
    action: string
    label: string
    actorLabel: string
    createdAt: string
    targetType: string
  }>
}

