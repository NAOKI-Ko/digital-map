export type PublicAnalyticsEvent = { type: 'MAP_VIEW', mapId: string } | { type: 'SPOT_VIEW', mapId: string, spotId: string }

export function sendPublicAnalytics(event: PublicAnalyticsEvent) {
  const body = JSON.stringify(event)
  if (typeof navigator !== 'undefined' && navigator.sendBeacon?.('/api/analytics', new Blob([body], { type: 'application/json' }))) return
  void fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => undefined)
}

export function recordMapViewOnce(mapId: string, releaseId: string) {
  const key = `digital-map:view:${mapId}:${releaseId}`
  if (sessionStorage.getItem(key)) return false
  sessionStorage.setItem(key, '1')
  sendPublicAnalytics({ type: 'MAP_VIEW', mapId })
  return true
}
