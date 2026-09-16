export interface ScreenPoint {
  x: number
  y: number
}

export interface MapCenter {
  lat: number
  lng: number
}

function cross(a: ScreenPoint, b: ScreenPoint, point: ScreenPoint) {
  return (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x)
}

export function isPointInsideConvexPolygon(point: ScreenPoint, polygon: readonly ScreenPoint[]) {
  if (polygon.length < 3) return false
  let sign = 0
  for (let index = 0; index < polygon.length; index += 1) {
    const a = polygon[index]!
    const b = polygon[(index + 1) % polygon.length]!
    const value = cross(a, b, point)
    if (Math.abs(value) < 0.01) continue
    const nextSign = Math.sign(value)
    if (sign !== 0 && nextSign !== sign) return false
    sign = nextSign
  }
  return true
}

export function getCoverViewportCorners(width: number, currentHeight: number, coverHeight = currentHeight) {
  const top = (currentHeight - coverHeight) / 2
  return [
    { x: 0, y: top },
    { x: width, y: top },
    { x: width, y: top + coverHeight },
    { x: 0, y: top + coverHeight },
  ] as const
}

export function isViewportCoveredByPolygon(
  polygon: readonly ScreenPoint[],
  width: number,
  currentHeight: number,
  coverHeight = currentHeight,
) {
  if (width <= 0 || currentHeight <= 0 || coverHeight <= 0) return false
  return getCoverViewportCorners(width, currentHeight, coverHeight)
    .every(point => isPointInsideConvexPolygon(point, polygon))
}

export function interpolateMapCenter(from: MapCenter, to: MapCenter, amount: number): MapCenter {
  const safeAmount = Math.min(1, Math.max(0, amount))
  return {
    lat: from.lat + (to.lat - from.lat) * safeAmount,
    lng: from.lng + (to.lng - from.lng) * safeAmount,
  }
}

export function getViewportOrientation(width: number, height: number) {
  return width > height ? 'landscape' : 'portrait'
}
