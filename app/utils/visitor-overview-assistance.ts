import { getVisitorFacilityPreset, type VisitorPinAppearance } from '~/utils/visitor-facility-summary'

interface CategoryPlacement extends VisitorPinAppearance {
  categories: readonly { id: string }[]
}

/** A shortcut can only target one existing category made entirely of explicit facilities. */
export function getExclusiveFacilityCategoryId(placements: readonly CategoryPlacement[]) {
  const candidates = new Map<string, boolean>()
  for (const placement of placements) {
    const facility = Boolean(getVisitorFacilityPreset(placement))
    for (const category of placement.categories) {
      candidates.set(category.id, (candidates.get(category.id) ?? true) && facility)
    }
  }
  const ids = [...candidates].filter(([, onlyFacilities]) => onlyFacilities).map(([id]) => id)
  if (ids.length !== 1) return null
  const id = ids[0]!
  // The shortcut promises all explicit equipment, including uncategorized placements.
  const coversFacilities = placements.every(placement => !getVisitorFacilityPreset(placement)
    || placement.categories.some(category => category.id === id))
  return coversFacilities ? id : null
}

/** Only ready, unselected, unobstructed exploration can consume a resize recommendation. */
export function isVisitorOverviewAssistanceEnabled(ready: boolean, selectedSpotId: string | null, modalBlocked: boolean) {
  return ready && !selectedSpotId && !modalBlocked
}

export interface VisitorViewportSize { width: number, height: number }

/** Read-only resize policy: a deliberate Overview click remains the only camera action. */
export function createVisitorOverviewSuggestion() {
  let baseline: VisitorViewportSize | null = null
  let announced = false
  return {
    reset(size: VisitorViewportSize) { baseline = size.width > 0 && size.height > 0 ? { ...size } : null },
    measure(size: VisitorViewportSize, enabled: boolean) {
      if (size.width <= 0 || size.height <= 0) { baseline = null; return false }
      if (!enabled || !baseline) { baseline = { ...size }; return false }
      if (announced || size.height < 300 || size.width < 768) return false
      const largeGrowth = size.width - baseline.width >= 160
        && size.width >= baseline.width * 1.35
        && size.width * size.height >= baseline.width * baseline.height * 1.3
      if (!largeGrowth) return false
      announced = true
      return true
    },
  }
}

/** The OR selection's existing dock/sentinel must settle before the explicit Overview. */
export async function showOverviewAfterDockUpdate(options: {
  nextRender: () => Promise<unknown>
  nextFrame: () => Promise<unknown>
  measureDock: () => void
  isCurrent: () => boolean
  showWholeFloor: () => void
}) {
  await options.nextRender()
  await options.nextFrame()
  options.measureDock()
  await options.nextRender()
  if (options.isCurrent()) options.showWholeFloor()
}
