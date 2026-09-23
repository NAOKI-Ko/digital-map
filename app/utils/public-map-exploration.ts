export interface Point { x: number, y: number }
export interface Size { width: number, height: number }
export interface OccludingPanel { left: number, top: number }

/** MapLibre panBy screen-pixel offset. A visible PIN must never trigger a camera move. */
export function getMinimalSpotPan(point: Point, viewport: Size, panel: OccludingPanel | null, margin = 44): [number, number] {
  const left = margin
  const top = margin
  let right = viewport.width - margin
  let bottom = viewport.height - margin
  if (panel && panel.left > viewport.width / 2) right = Math.min(right, panel.left - margin)
  if (panel && panel.left <= viewport.width / 2 && panel.top > 0) bottom = Math.min(bottom, panel.top - margin)
  if (right <= left || bottom <= top) return [0, 0]
  const dx = point.x < left ? left - point.x : point.x > right ? right - point.x : 0
  const dy = point.y < top ? top - point.y : point.y > bottom ? bottom - point.y : 0
  return [dx, dy]
}

export function needsHeadingReset(bearing: number, pitch: number, homePitch: number) {
  return Math.abs(bearing) >= 1 || Math.abs(pitch - homePitch) >= 1
}
