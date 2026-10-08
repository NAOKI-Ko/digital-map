import { getPinIconPreset } from '~~/shared/constants/spot'

export interface VisitorPinAppearance {
  pinIconType: string
  pinIconId?: string | null
}

export type VisitorFacilityPreset = Extract<ReturnType<typeof getPinIconPreset>, { family: 'facility' }> & { shortLabel: string }

/** Only an explicitly authored, supported facility preset supplies a visitor symbol. */
export function getVisitorFacilityPreset(appearance: VisitorPinAppearance): VisitorFacilityPreset | null {
  if (appearance.pinIconType !== 'preset') return null
  const preset = getPinIconPreset(appearance.pinIconId)
  if (preset.family !== 'facility') return null
  return { ...preset, shortLabel: preset.id === 'facility:elevator' ? 'EV' : preset.label }
}

/** Counts describe placements; the compact symbol list describes distinct equipment kinds. */
export function summarizeVisitorFacilities(placements: readonly VisitorPinAppearance[]) {
  const facilities: VisitorFacilityPreset[] = []
  const seen = new Set<string>()
  let facilityCount = 0
  for (const placement of placements) {
    const preset = getVisitorFacilityPreset(placement)
    if (!preset) continue
    facilityCount += 1
    if (seen.has(preset.id)) continue
    seen.add(preset.id)
    facilities.push(preset)
  }
  return { destinationCount: placements.length - facilityCount, facilityCount, facilities }
}
