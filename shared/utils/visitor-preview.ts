export type VisitorPreviewEntry = 'home' | 'publish'

export function visitorPreviewPath(mapId: string, from: VisitorPreviewEntry) {
  return `/admin/maps/${encodeURIComponent(mapId)}/preview?from=${from}`
}

export function visitorPreviewReturnPath(mapId: string, from: unknown) {
  const home = `/admin/maps/${encodeURIComponent(mapId)}`
  return from === 'publish' ? `${home}/publish` : home
}
