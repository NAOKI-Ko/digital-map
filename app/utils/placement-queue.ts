interface QueueSpot { id: string, name: string, floorId: string, x: number | null, y: number | null }
/** Reconstructed from server facts; skipped items remain unplaced, never completed. */
export function placementQueue<T extends QueueSpot>(spots: readonly T[], floorId: string, skipped: readonly string[] = []): T[] {
  return spots.filter(spot => spot.floorId === floorId && (spot.x === null || spot.y === null) && !skipped.includes(spot.id))
    .toSorted((a, b) => a.name.localeCompare(b.name, 'ja') || a.id.localeCompare(b.id))
}
