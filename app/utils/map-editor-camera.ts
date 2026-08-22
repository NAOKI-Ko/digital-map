import type { MapViewerCameraState } from '~~/shared/types/map-viewer'

export interface MapEditorReturnContext extends MapViewerCameraState {
  floorId: string
}

function parseNumber(value: unknown, minimum: number, maximum: number) {
  if (typeof value !== 'string' || value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum ? parsed : null
}

export function parseMapEditorReturnContext(query: Record<string, unknown>) {
  const floorId = typeof query.floorId === 'string' ? query.floorId : ''
  const lat = parseNumber(query.cameraLat, -90, 90)
  const lng = parseNumber(query.cameraLng, -180, 180)
  const zoom = parseNumber(query.cameraZoom, 0, 24)

  if (!floorId || lat === null || lng === null || zoom === null) return null

  return {
    floorId,
    center: { lat, lng },
    zoom,
  } satisfies MapEditorReturnContext
}

export function resolveMapEditorReturnContext(
  query: Record<string, unknown>,
  floorIds: readonly string[],
) {
  const context = parseMapEditorReturnContext(query)
  return context && floorIds.includes(context.floorId) ? context : null
}

export function createMapEditorReturnQuery(context: MapEditorReturnContext) {
  return {
    floorId: context.floorId,
    cameraLat: context.center.lat.toString(),
    cameraLng: context.center.lng.toString(),
    cameraZoom: context.zoom.toString(),
  }
}
