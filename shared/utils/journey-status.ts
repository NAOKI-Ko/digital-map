import type { AdminSpotSummary } from '../types/spot'

// Guidance only. Publication and authorization continue to use their existing gates.
export function journeyStatus(spots: Pick<AdminSpotSummary, 'hasPositionedPlacement' | 'isPublished' | 'photoCount'>[]) {
  const placed = spots.filter(spot => spot.hasPositionedPlacement === true)
  return {
    total: spots.length,
    unplaced: spots.length - placed.length,
    targetOff: placed.filter(spot => !spot.isPublished).length,
    candidates: placed.filter(spot => spot.isPublished).length,
    withoutPhoto: spots.filter(spot => spot.photoCount === 0).length,
  }
}
