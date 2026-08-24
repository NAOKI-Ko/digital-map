import type { MapViewerSpot } from '~~/shared/types/map-viewer'

export function collectSpotCategories(spots: readonly MapViewerSpot[]) {
  return [...new Map(spots.flatMap(spot => spot.categories).map(category => [category.id, category])).values()]
    .sort((left, right) => left.order - right.order || left.name.localeCompare(right.name, 'ja'))
}

export function filterSpotsByCategoryIds(spots: readonly MapViewerSpot[], categoryIds: readonly string[]) {
  if (categoryIds.length === 0) return [...spots]
  const selected = new Set(categoryIds)
  return spots.filter(spot => spot.categories.some(category => selected.has(category.id)))
}
