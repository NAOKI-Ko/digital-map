import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getVisitorFacilityPreset, summarizeVisitorFacilities } from '../app/utils/visitor-facility-summary'
import type { PublicMapResponse } from '../shared/types/public-map'

const appearance = (pinIconId: string | null, pinIconType = 'preset') => ({ pinIconType, pinIconId })

describe('visitor equipment summaries use explicit appearance and count placements', () => {
  it('exposes all eight supported equipment kinds with controlled local symbols and concise labels', () => {
    const ids = ['wc', 'accessible-wc', 'elevator', 'stairs', 'escalator', 'nursing', 'aed', 'information']
    const summary = summarizeVisitorFacilities(ids.map(id => appearance(`facility:${id}`)))
    expect(summary.facilityCount).toBe(8)
    expect(summary.destinationCount).toBe(0)
    expect(summary.facilities.map(preset => preset.shortLabel)).toEqual(['トイレ', '多目的トイレ', 'EV', '階段', 'エスカレーター', '授乳室', 'AED', '案内所'])
    expect(summary.facilities.every(preset => preset.imageUrl.startsWith('/icons/facilities/'))).toBe(true)
    expect(summary.facilities.find(preset => preset.id === 'facility:aed')?.text).toBe('AED')
  })

  it('deduplicates kinds in first appearance order while counting repeated placements', () => {
    const placements = [
      { ...appearance('facility:stairs'), canonicalSpotId: 'shared', placementId: 'stairs-1' },
      { ...appearance('facility:wc'), canonicalSpotId: 'toilet', placementId: 'wc-1' },
      { ...appearance('facility:stairs'), canonicalSpotId: 'shared', placementId: 'stairs-2' },
      { ...appearance('kanji:食'), canonicalSpotId: 'cafe', placementId: 'cafe-1' },
      { ...appearance('facility:wc'), canonicalSpotId: 'toilet', placementId: 'wc-2' },
    ]
    const summary = summarizeVisitorFacilities(placements)
    expect(summary.facilityCount).toBe(4)
    expect(summary.destinationCount).toBe(1)
    expect(summary.facilities.map(preset => preset.id)).toEqual(['facility:stairs', 'facility:wc'])
  })

  it.each(['material:wc', 'material:info', 'kanji:i', 'information', 'wc', 'facility:unknown', null])('does not infer a facility from legacy or unknown ID %s', (id) => {
    const legacy = { ...appearance(id), name: 'トイレ', categories: [{ name: '設備' }] }
    expect(getVisitorFacilityPreset(legacy)).toBeNull()
    expect(summarizeVisitorFacilities([legacy])).toEqual({ destinationCount: 1, facilityCount: 0, facilities: [] })
  })

  it.each(['custom', 'illustration'])('keeps a %s image with a coincidental facility ID out of equipment summaries', (type) => {
    expect(getVisitorFacilityPreset(appearance('facility:wc', type))).toBeNull()
    expect(summarizeVisitorFacilities([appearance('facility:wc', type)]).destinationCount).toBe(1)
  })

  it('keeps the fixed fixture untouched and counts each displayed floor separately', () => {
    const fixture = JSON.parse(readFileSync(new URL('../server/fixtures/wu77-visitor.json', import.meta.url), 'utf8')) as PublicMapResponse
    const before = JSON.stringify(fixture)
    expect(fixture.map.floors.map(floor => {
      const summary = summarizeVisitorFacilities(floor.spots)
      return [summary.destinationCount, summary.facilityCount]
    })).toEqual([[12, 12], [6, 6]])
    expect(JSON.stringify(fixture)).toBe(before)
    expect(summarizeVisitorFacilities([])).toEqual({ destinationCount: 0, facilityCount: 0, facilities: [] })
  })
})
