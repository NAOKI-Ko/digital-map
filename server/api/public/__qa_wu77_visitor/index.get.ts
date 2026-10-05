import fixture from '../../../fixtures/wu77-visitor.json'
import type { PublicMapResponse } from '~~/shared/types/public-map'

/** Fixed, synthetic visitor comparison. Never reads or writes a database. */
export function createWu77VisitorFixture(baseline = false): PublicMapResponse {
  if (!import.meta.dev) throw createError({ statusCode: 404 })
  const response = structuredClone(fixture) as PublicMapResponse
  if (baseline) {
    const legacy: Record<string, string> = {
      'facility:wc': 'material:wc',
      'facility:accessible-wc': 'material:wc',
      'facility:elevator': 'material:directions_walk',
      'facility:stairs': 'material:directions_walk',
      'facility:escalator': 'material:directions_walk',
      'facility:nursing': 'material:info',
      'facility:aed': 'material:medical_services',
      'facility:information': 'material:info',
    }
    for (const floor of response.map.floors) {
      for (const spot of floor.spots) {
        if (spot.pinIconId && legacy[spot.pinIconId]) spot.pinIconId = legacy[spot.pinIconId]!
      }
    }
  }
  return response
}

export default defineEventHandler(() => createWu77VisitorFixture())
