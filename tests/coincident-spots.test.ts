import { describe, expect, it } from 'vitest'
import { getCoincidentSpots } from '../app/utils/coincident-spots'
import type { MapViewerSpot } from '../shared/types/map-viewer'
const spot = (id: string, x = .5, y = .5) => ({ id, x, y, categories: [] } as MapViewerSpot)
describe('exact-coordinate detail recovery', () => {
  it('returns every alternate at the same coordinate, regardless of importance/category, in stable order', () => {
    const selected = spot('b'), spots = [spot('z'), spot('a'), selected, spot('near', .50001), spot('elsewhere', .5, .6)]
    const before = JSON.stringify(spots)
    expect(getCoincidentSpots(spots, selected).map(s => s.id)).toEqual(['a', 'z'])
    expect(getCoincidentSpots(spots.reverse(), selected).map(s => s.id)).toEqual(['a', 'z'])
    expect(JSON.stringify(spots.reverse())).toBe(before)
    expect(getCoincidentSpots(spots.filter(s => s.id !== 'a'), selected).map(s => s.id)).toEqual(['z'])
  })
  it('has no recovery links for absent or invalid selection', () => {
    expect(getCoincidentSpots([spot('a')], null)).toEqual([])
    expect(getCoincidentSpots([spot('a', NaN)], spot('b', NaN))).toEqual([])
  })
})
