import { imageToRenderCoordinates } from '~~/lib/geo'
import type { MapViewerFloor, MapViewerSpot } from '~~/shared/types/map-viewer'

export const VISITOR_INITIAL_PITCH = 25
export const VISITOR_INITIAL_ZOOM_ALLOWANCE = 0.65
// Keep mobile edge facilities inside the initial frame; their controls need no
// discovery zoom before the visitor starts exploring.
export const VISITOR_MOBILE_INITIAL_ZOOM_ALLOWANCE = 0
export const VISITOR_INITIAL_FALLBACK_ZOOM_OFFSET = 0.2
export const VISITOR_MOBILE_INITIAL_FALLBACK_ZOOM_OFFSET = 0
export const VISITOR_INITIAL_ZOOM_MINIMUM = 0.55

/** Full Floor's unfiltered content only; filter/detail never feeds initial framing. */
export function getVisitorContentBounds(floor: MapViewerFloor, spots: readonly MapViewerSpot[]) {
  if (!spots.length || spots.some(s => !Number.isFinite(s.x) || !Number.isFinite(s.y) || s.x < 0 || s.x > 1 || s.y < 0 || s.y > 1)) return null
  const xs = spots.map(s => s.x), ys = spots.map(s => s.y)
  const left = Math.min(...xs), right = Math.max(...xs), top = Math.min(...ys), bottom = Math.max(...ys)
  // Extremely broad content uses the recoverable full-floor baseline.
  if (right - left > 0.95 || bottom - top > 0.95) return null
  const pad = 0.08
  const points = [
    { x: Math.max(0, left - pad), y: Math.max(0, top - pad) },
    { x: Math.min(1, right + pad), y: Math.max(0, top - pad) },
    { x: Math.min(1, right + pad), y: Math.min(1, bottom + pad) },
    { x: Math.max(0, left - pad), y: Math.min(1, bottom + pad) },
  ].map(point => imageToRenderCoordinates(floor, point))
  if (points.some(p => !p)) return null
  const origin = points[0]!.lng
  const lngs = points.map(p => p!.lng + 360 * Math.round((origin - p!.lng) / 360)), lats = points.map(p => p!.lat)
  return [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]] as [[number, number], [number, number]]
}

export function clampVisitorInitialZoom(fitZoom: number, contentZoom: number, allowance = VISITOR_INITIAL_ZOOM_ALLOWANCE) {
  if (!Number.isFinite(contentZoom)) return fitZoom
  return Math.min(fitZoom + Math.min(allowance, VISITOR_INITIAL_ZOOM_ALLOWANCE), contentZoom)
}

/** Broad content uses bounded whole-floor discovery instead of a misleading compact-content fit. */
export function canUseVisitorContentCamera(fitZoom: number, contentZoom: number | undefined) {
  return contentZoom !== undefined && Number.isFinite(contentZoom) && contentZoom >= fitZoom + VISITOR_INITIAL_ZOOM_MINIMUM
}
