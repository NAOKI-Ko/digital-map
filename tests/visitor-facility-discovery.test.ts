import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { collectSpotCategories, filterSpotsByCategoryIds } from '../app/utils/category-filter'
import { closeFilteredSpot, selectedSpotIdFromOverlay } from '../app/utils/public-map-ui'
import { isFacilityPinIcon } from '../shared/constants/spot'
import type { PublicMapResponse } from '../shared/types/public-map'

const fixture = JSON.parse(readFileSync(new URL('../server/fixtures/wu77-visitor.json', import.meta.url), 'utf8')) as PublicMapResponse
const secondFloor = fixture.map.floors[0]!
const thirdFloor = fixture.map.floors[1]!
const categoryId = (name: string) => collectSpotCategories(secondFloor.spots).find(category => category.name === name)!.id

describe('WU-77 fixed visitor discovery journey', () => {
  it('finds both toilets using the facility category on the displayed floor', () => {
    const visible = filterSpotsByCategoryIds(secondFloor.spots, [categoryId('設備')])
    expect(visible).toHaveLength(12)
    expect(visible.filter(isFacilityPinIcon)).toHaveLength(12)
    expect(visible.find(spot => spot.name === '北側トイレ')?.pinIconId).toBe('facility:wc')
    expect(visible.find(spot => spot.name === '多目的トイレ')?.pinIconId).toBe('facility:accessible-wc')
    expect(visible.every(spot => spot.floorId === secondFloor.id)).toBe(true)
  })

  it('adds a second category with OR and restores every placement after clearing', () => {
    const dining = filterSpotsByCategoryIds(secondFloor.spots, [categoryId('飲食')])
    const combined = filterSpotsByCategoryIds(secondFloor.spots, [categoryId('飲食'), categoryId('ショップ')])
    expect(dining).toHaveLength(4)
    expect(combined).toHaveLength(8)
    expect(combined).toEqual(expect.arrayContaining(dining))
    expect(new Set(combined.map(spot => spot.id)).size).toBe(8)
    expect(filterSpotsByCategoryIds(secondFloor.spots, [])).toEqual(secondFloor.spots)
  })

  it('retains an open detail while its category is visible and closes it when excluded', () => {
    const spot = secondFloor.spots.find(item => item.name === '海の展示A')!
    const overlay = { type: 'spot' as const, spotId: spot.id }
    const exhibition = filterSpotsByCategoryIds(secondFloor.spots, [categoryId('展示')])
    expect(selectedSpotIdFromOverlay(closeFilteredSpot(overlay, exhibition.map(item => item.id)))).toBe(spot.id)
    const dining = filterSpotsByCategoryIds(secondFloor.spots, [categoryId('飲食')])
    expect(closeFilteredSpot(overlay, dining.map(item => item.id))).toBeNull()
  })

  it('uses each displayed floor for counts and facility availability without mutating the snapshot', () => {
    const before = JSON.stringify(fixture)
    const selected = [categoryId('飲食'), categoryId('設備')]
    expect(filterSpotsByCategoryIds(secondFloor.spots, selected)).toHaveLength(16)
    expect(filterSpotsByCategoryIds(thirdFloor.spots, selected)).toHaveLength(8)
    expect(thirdFloor.spots.filter(isFacilityPinIcon)).toHaveLength(6)
    expect(filterSpotsByCategoryIds(secondFloor.spots, selected)).toHaveLength(16)
    expect(JSON.stringify(fixture)).toBe(before)
  })

  it('does not show a facility legend merely because legacy spots say toilet or use the facility category', () => {
    const legacy = secondFloor.spots.map(spot => isFacilityPinIcon(spot) ? { ...spot, pinIconId: 'material:wc' } : spot)
    expect(legacy.some(spot => spot.name.includes('トイレ'))).toBe(true)
    expect(collectSpotCategories(legacy).some(category => category.name === '設備')).toBe(true)
    expect(legacy.some(isFacilityPinIcon)).toBe(false)
    expect(isFacilityPinIcon({ pinIconType: 'custom', pinIconId: 'facility:wc' })).toBe(false)
    expect(isFacilityPinIcon({ pinIconType: 'preset', pinIconId: 'facility:future-unknown' })).toBe(false)
  })
})
