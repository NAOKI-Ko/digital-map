export function shouldShowFloorSelector(floorCount: number) {
  return floorCount >= 2
}

export type PublicOverlay = { type: 'spot', spotId: string } | { type: 'floor' } | { type: 'info' } | null

export function selectedSpotIdFromOverlay(overlay: PublicOverlay) {
  return overlay?.type === 'spot' ? overlay.spotId : null
}

export function closeFilteredSpot(overlay: PublicOverlay, visibleSpotIds: string[]): PublicOverlay {
  return overlay?.type === 'spot' && !visibleSpotIds.includes(overlay.spotId) ? null : overlay
}

export function createFloorSwitchState(currentFloorId: string, nextFloorId: string) {
  if (currentFloorId === nextFloorId) return null
  return {
    floorId: nextFloorId,
    selectedSpotId: null,
    selectedCategoryIds: [] as string[],
  }
}
