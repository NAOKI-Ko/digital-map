import { describe, expect, it } from 'vitest'
import { facilityIconPresets, getPinIconPreset, isFacilityPinIcon, normalizePinIconId, pinIconTypes } from '../shared/constants/spot'
import { pinDesignSchema } from '../shared/schemas/pin-design'
import { resolveEffectivePinAppearance } from '../shared/utils/pin-appearance'
import { getSpotMarkerPresentation, getSpotMarkerVisitorLabel } from '../app/utils/marker-element'
import { getMarkerDensityPresentation } from '../app/utils/marker-density'
import type { MapViewerSpot } from '../shared/types/map-viewer'

const spot: MapViewerSpot = {
  id: 'facility-1', name: '北側', x: .4, y: .5, categories: [], importance: 'normal',
  pinIconType: 'preset', pinIconId: 'facility:wc', pinIconImageUrl: null,
  pinColor: '#2563EB', pinSize: 'medium',
}

describe('explicit facility presets within the existing appearance contract', () => {
  it('provides the eight authored equipment choices using fixed local glyph assets', () => {
    expect(facilityIconPresets.map(preset => preset.id)).toEqual([
      'facility:wc', 'facility:accessible-wc', 'facility:elevator', 'facility:stairs',
      'facility:escalator', 'facility:nursing', 'facility:aed', 'facility:information',
    ])
    for (const preset of facilityIconPresets) {
      expect(getPinIconPreset(preset.id)).toMatchObject({ family: 'facility', symbol: preset.name, label: preset.label, imageUrl: `/icons/facilities/${preset.name}.svg` })
      expect(getSpotMarkerPresentation({ ...spot, pinIconId: preset.id }).facilityImageUrl).toBe(preset.imageUrl)
    }
    expect(getPinIconPreset('facility:aed').text).toBe('AED')
  })

  it.each(facilityIconPresets)('$id persists as preset with its exact ID and no new pin type', (preset) => {
    const design = pinDesignSchema.parse({ ...spot, pinIconId: preset.id })
    expect(design.pinIconType).toBe('preset')
    expect(design.pinIconId).toBe(preset.id)
    expect(normalizePinIconId(design.pinIconId)).toBe(preset.id)
    expect(pinIconTypes).toEqual(['preset', 'custom', 'illustration'])
  })

  it.each(['material:wc', 'material:info', 'kanji:i', 'information', 'wc', 'facility:unknown'])('does not infer equipment from legacy/unknown ID %s or name/category', (id) => {
    const legacy = { ...spot, pinIconId: id, name: 'トイレ', categories: [{ id: 'equipment', name: '設備', order: 0 }] }
    expect(isFacilityPinIcon(legacy)).toBe(false)
    expect(getSpotMarkerPresentation(legacy).facility).toBe(false)
    expect(getPinIconPreset(id).family).not.toBe('facility')
  })

  it('rejects unknown facility IDs and requires explicit preset selection', () => {
    expect(pinDesignSchema.safeParse({ ...spot, pinIconId: 'facility:unknown' }).success).toBe(false)
    for (const pinIconType of ['custom', 'illustration'] as const) {
      const image = { ...spot, pinIconType, pinIconImageUrl: '/uploads/pin.png' }
      expect(isFacilityPinIcon(image)).toBe(false)
      expect(getSpotMarkerPresentation(image)).toMatchObject({ type: pinIconType, facility: false, imageUrl: '/uploads/pin.png' })
    }
  })

  it('preserves category inheritance and concrete release output while LIVE follows later changes', () => {
    const input = { ...spot, pinSourceMode: 'category', pinSourceCategory: {
      pinDefaultType: 'preset', pinDefaultIconId: 'facility:elevator', pinDefaultColor: '#047857', pinDefaultSize: 'small',
    } }
    const release = structuredClone(resolveEffectivePinAppearance(input))
    input.pinSourceCategory.pinDefaultIconId = 'facility:stairs'
    expect(release).toMatchObject({ pinIconType: 'preset', pinIconId: 'facility:elevator', pinSize: 'small', pinColor: '#047857' })
    expect(resolveEffectivePinAppearance(input).pinIconId).toBe('facility:stairs')
    expect(resolveEffectivePinAppearance({ ...input, pinSourceMode: 'individual' }).pinIconId).toBe('facility:wc')
  })

  it('retains equipment meaning through collision recovery and returns to the detail action', () => {
    expect(getSpotMarkerVisitorLabel(spot)).toBe('北側（設備・トイレ）の詳細を表示')
    expect(getSpotMarkerVisitorLabel(spot, 3)).toBe('北側（設備・トイレ）の周辺ピンを表示（3件）')
    expect(getSpotMarkerVisitorLabel(spot, 3, false)).toBe('北側（設備・トイレ）の周辺ピンを表示')
    expect(getSpotMarkerVisitorLabel({ ...spot, pinIconId: 'material:wc' }, 1)).toBe('北側の詳細を表示')
  })

  it.each(['small', 'medium', 'large'] as const)('%s remains independent of selected/category/featured priority', (size) => {
    const normal = getMarkerDensityPresentation('normal', size, 0, 0, false, false, true)
    const featured = getMarkerDensityPresentation('featured', size, 0, 0, false, false, true)
    const category = getMarkerDensityPresentation('normal', size, 0, 0, false, true, true)
    const selected = getMarkerDensityPresentation('normal', size, 0, 0, true, false, true)
    expect([selected.priority, category.priority, featured.priority, normal.priority]).toEqual([4, 3, 2, 1])
    expect([selected.scale, category.scale, featured.scale]).toEqual([normal.scale, normal.scale, normal.scale])
  })
})
