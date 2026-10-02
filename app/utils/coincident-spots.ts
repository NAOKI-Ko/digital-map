import type { MapViewerSpot } from '~~/shared/types/map-viewer'

/** Alternate detail selection for exact coordinates; never move canonical or rendered PINs. */
export function getCoincidentSpots<T extends MapViewerSpot>(spots: readonly T[], selected: T | null): T[] {
  if (!selected || !Number.isFinite(selected.x) || !Number.isFinite(selected.y)) return []
  return spots.filter(spot => spot.id !== selected.id && spot.x === selected.x && spot.y === selected.y)
    .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
}
