export function shouldShowFloorSelector(floorCount: number) {
  return floorCount >= 2
}

export function createFloorSwitchState(currentFloorId: string, nextFloorId: string) {
  if (currentFloorId === nextFloorId) return null
  return {
    floorId: nextFloorId,
    selectedSpotId: null,
    selectedCategoryIds: [] as string[],
  }
}
