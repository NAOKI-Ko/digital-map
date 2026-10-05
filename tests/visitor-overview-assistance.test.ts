import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { createVisitorOverviewSuggestion, getExclusiveFacilityCategoryId, isVisitorOverviewAssistanceEnabled, showOverviewAfterDockUpdate } from '../app/utils/visitor-overview-assistance'
import { filterSpotsByCategoryIds } from '../app/utils/category-filter'
import type { PublicMapResponse } from '../shared/types/public-map'

const placement = (id: string, categoryIds: string[], pinIconId = 'facility:wc', pinIconType = 'preset') => ({
  id, pinIconType, pinIconId, categories: categoryIds.map(id => ({ id })),
})
describe('explicit facility category shortcut', () => {
  it('uses the existing unique all-facility category on both fixed floors, retaining OR selections and placement counts', () => {
    const fixture = JSON.parse(readFileSync(new URL('../server/fixtures/wu77-visitor.json', import.meta.url), 'utf8')) as PublicMapResponse
    const before = JSON.stringify(fixture)
    for (const floor of fixture.map.floors) {
      const id = getExclusiveFacilityCategoryId(floor.spots)
      expect(id).not.toBeNull()
      const members = floor.spots.filter(spot => spot.categories.some(category => category.id === id))
      expect(members.length).toBe(floor.id === fixture.map.floors[0]!.id ? 12 : 6)
      const existing = floor.spots.find(spot => !members.includes(spot))!.categories[0]!.id
      const selected = [existing, id!]
      const visible = filterSpotsByCategoryIds(floor.spots, selected)
      expect(members.every(spot => visible.some(item => item.id === spot.id))).toBe(true)
      expect(visible.some(spot => !members.some(member => member.id === spot.id))).toBe(true)
      expect(selected[0]).toBe(existing)
    }
    expect(JSON.stringify(fixture)).toBe(before)
  })
  it('counts repeated placements but never infers a shortcut from a category or spot name', () => {
    const pins = [placement('shared-1', ['equipment']), placement('shared-2', ['equipment'], 'facility:stairs')]
    expect(getExclusiveFacilityCategoryId(pins)).toBe('equipment')
    const namedLegacy = { ...placement('legacy', ['equipment'], 'material:wc'), name: '設備' }
    expect(getExclusiveFacilityCategoryId([...pins, namedLegacy])).toBeNull()
    expect(getExclusiveFacilityCategoryId([])).toBeNull()
    expect(getExclusiveFacilityCategoryId([placement('uncategorized', [])])).toBeNull()
    expect(getExclusiveFacilityCategoryId([placement('ambiguous', ['one', 'two'])])).toBeNull()
  })
  it('requires the pure category to cover every explicit facility, including uncategorized or mixed-only AED', () => {
    const wc = placement('wc', ['equipment'])
    expect(getExclusiveFacilityCategoryId([wc, placement('aed', [], 'facility:aed')])).toBeNull()
    expect(getExclusiveFacilityCategoryId([
      wc, placement('aed', ['mixed'], 'facility:aed'), placement('destination', ['mixed'], 'shop'),
    ])).toBeNull()
    // Additional mixed memberships are harmless when all facilities also share equipment.
    expect(getExclusiveFacilityCategoryId([
      placement('wc', ['equipment', 'mixed']), placement('aed', ['equipment', 'mixed'], 'facility:aed'),
      placement('destination', ['mixed'], 'shop'),
    ])).toBe('equipment')
  })
  it.each([['facility:unknown', 'preset'], ['facility:wc', 'custom'], ['facility:wc', 'illustration'], ['shop', 'preset']])('excludes mixed category member %s/%s', (id, type) => {
    expect(getExclusiveFacilityCategoryId([placement('supported', ['equipment']), placement('mixed', ['equipment'], id, type)])).toBeNull()
  })
})
describe('explicit Overview after category layout', () => {
  it('waits for OR rendering, a layout frame, measured dock and sentinel rendering before invoking Overview once', async () => {
    const steps: string[] = []
    let renders = 0
    const showWholeFloor = vi.fn(() => steps.push('overview'))
    await showOverviewAfterDockUpdate({
      nextRender: async () => { steps.push(++renders === 1 ? 'OR render' : 'sentinel render') },
      nextFrame: async () => { steps.push('layout frame') },
      measureDock: () => { steps.push('dock measurement') },
      isCurrent: () => true, showWholeFloor,
    })
    expect(steps).toEqual(['OR render', 'layout frame', 'dock measurement', 'sentinel render', 'overview'])
    expect(showWholeFloor).toHaveBeenCalledOnce()
  })
  it('does not invoke Overview if Floor, selection or overlay changed while the dock was settling', async () => {
    const showWholeFloor = vi.fn()
    await showOverviewAfterDockUpdate({ nextRender: async () => {}, nextFrame: async () => {}, measureDock: () => {}, isCurrent: () => false, showWholeFloor })
    expect(showWholeFloor).not.toHaveBeenCalled()
  })
})
describe('camera-free resize recommendation', () => {
  it('suggests once for the ready 390→430→768→1024→1440 sequence', () => {
    const policy = createVisitorOverviewSuggestion()
    const sizes = [{ width:390,height:844 },{ width:430,height:932 },{ width:768,height:968 },{ width:1024,height:712 },{ width:1440,height:844 }]
    const before = JSON.stringify(sizes)
    expect(sizes.map(size => policy.measure(size, true))).toEqual([false,false,true,false,false])
    expect(JSON.stringify(sizes)).toBe(before)
  })
  it('does not suggest on a fresh large viewport, small changes, height-only changes or cold loading', () => {
    const policy = createVisitorOverviewSuggestion()
    expect(policy.measure({width:1440,height:844},false)).toBe(false)
    policy.reset({width:1440,height:844}) // Ready starts a new baseline.
    expect(policy.measure({width:1440,height:844},true)).toBe(false)
    expect(policy.measure({width:1440,height:1024},true)).toBe(false)
    expect(policy.measure({width:1500,height:844},true)).toBe(false)
  })
  it('rebases blocked Detail/Floor changes without showing a delayed recommendation after closing', () => {
    const policy = createVisitorOverviewSuggestion()
    policy.measure({width:390,height:844},true)
    expect(policy.measure({width:1024,height:712},false)).toBe(false)
    expect(policy.measure({width:1024,height:712},true)).toBe(false)
    policy.reset({width:1440,height:844})
    expect(policy.measure({width:1440,height:844},true)).toBe(false)
  })
  it.each(['Floor', 'Info'])('does not consume a resize recommendation behind the %s modal or replay it after close', () => {
    const policy = createVisitorOverviewSuggestion()
    const small = { width:390,height:844 }, modalSize = { width:1024,height:712 }
    expect(isVisitorOverviewAssistanceEnabled(true, null, false)).toBe(true)
    policy.measure(small, true)
    // The modal blocks eligibility. The lifecycle reset on open/close keeps the current baseline.
    policy.reset(small)
    expect(policy.measure(modalSize, isVisitorOverviewAssistanceEnabled(true, null, true))).toBe(false)
    policy.reset(modalSize)
    expect(policy.measure(modalSize, isVisitorOverviewAssistanceEnabled(true, null, false))).toBe(false)
    // Blocking did not consume the one-shot allowance: a later independent large resize can suggest.
    expect(policy.measure({width:1440,height:844}, isVisitorOverviewAssistanceEnabled(true, null, false))).toBe(true)
    expect(policy.measure({width:1920,height:1080}, true)).toBe(false)
    expect(isVisitorOverviewAssistanceEnabled(false, null, false)).toBe(false)
    expect(isVisitorOverviewAssistanceEnabled(true, 'selected', false)).toBe(false)
  })
  it('keeps emphasized Overview focus legible with an inner separator and no box changes', () => {
    const viewer = readFileSync(new URL('../app/components/map/MapViewer.vue', import.meta.url), 'utf8')
    const focus = viewer.match(/\.visitor-theme \.visitor-map-viewer\.visitor-overview-suggested \.map-viewer-overview-control:focus-visible \{([^}]+)\}/)?.[1] ?? ''
    const emphasis = viewer.match(/\.visitor-map-viewer\.visitor-overview-suggested \.map-viewer-overview-control \{([^}]+)\}/)?.[1] ?? ''
    const outline = focus.match(/outline:\s*(\d+)px solid var\([^,]+,\s*(#[a-f0-9]{6})\)/i)!
    const offset = Number(focus.match(/outline-offset:\s*(-?\d+)px/)?.[1])
    const separator = focus.match(/box-shadow:\s*inset 0 0 0 (\d+)px white/)!
    const background = emphasis.match(/background:\s*(#[a-f0-9]{6})/i)![1]!
    expect(offset).toBeLessThan(0)
    expect(Number(separator[1])).toBeGreaterThanOrEqual(Number(outline[1]) + Math.abs(offset))
    expect(focus).not.toMatch(/\b(width|height|padding|border)\s*:/)
    const luminance = (hex: string) => [1, 3, 5].map(index => {
      const component = Number.parseInt(hex.slice(index, index + 2), 16) / 255
      return component <= .04045 ? component / 12.92 : ((component + .055) / 1.055) ** 2.4
    }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index]!, 0)
    // Actual default paint must contrast with the separator on both edges.
    for (const color of [outline[2]!, background]) expect(1.05 / (luminance(color) + .05)).toBeGreaterThanOrEqual(3)
  })
  it('does not suggest in a short viewport or before a real measured viewport exists', () => {
    const policy = createVisitorOverviewSuggestion()
    policy.reset({width:0,height:0})
    expect(policy.measure({width:1024,height:712},true)).toBe(false)
    policy.reset({width:390,height:844})
    expect(policy.measure({width:1440,height:240},true)).toBe(false)
  })
})
