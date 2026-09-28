import { describe, expect, it } from 'vitest'
import { resolveEffectivePinAppearance, standardPinAppearance } from '../shared/utils/pin-appearance'
import { pinSourceSchema } from '../shared/schemas/pin-source'
const individual = { pinIconType: 'preset', pinIconId: 'kanji:●', pinIconImageUrl: null, pinIconAssetId: null, pinColor: '#2563EB', pinSize: 'large' }
const category = { pinDefaultType: 'preset', pinDefaultIconId: 'kanji:●', pinDefaultColor: '#047857', pinDefaultSize: 'small' }
describe('PIN source contract', () => {
  it('preserves legacy and explicit tuples regardless of categories', () => {
    expect(resolveEffectivePinAppearance({ ...individual, pinSourceCategory: category })).toEqual(individual)
    expect(resolveEffectivePinAppearance({ ...individual, pinSourceMode: 'individual', pinSourceCategory: category })).toEqual(individual)
  })
  it('uses the whole standard tuple and never inherited importance', () => {
    expect(resolveEffectivePinAppearance({ ...individual, pinSourceMode: 'standard', pinSourceCategory: category })).toEqual(standardPinAppearance)
    expect(resolveEffectivePinAppearance({ ...individual, pinSourceMode: 'category', pinSourceCategory: category })).toEqual({ pinIconType: 'preset', pinIconId: 'kanji:●', pinIconAssetId: null, pinIconImageUrl: null, pinColor: '#047857', pinSize: 'small' })
  })
  it('dynamically resolves LIVE while previously resolved concrete output stays frozen', () => {
    const live = { ...individual, pinSourceMode: 'category', pinSourceCategory: { ...category } }
    const release = structuredClone(resolveEffectivePinAppearance(live))
    live.pinSourceCategory.pinDefaultColor = '#000000'
    expect(resolveEffectivePinAppearance(live).pinColor).toBe('#000000')
    expect(release.pinColor).toBe('#047857')
  })
  it('uses standard for explicitly selected category without default; missing category is an invariant failure', () => {
    expect(resolveEffectivePinAppearance({ ...individual, pinSourceMode: 'category', pinSourceCategory: {} })).toEqual(standardPinAppearance)
    expect(() => resolveEffectivePinAppearance({ ...individual, pinSourceMode: 'category' })).toThrow('missing')
  })
  it('does not accept category mode without explicit source, standard with retained source or a stale-less command', () => {
    expect(pinSourceSchema.safeParse({ mode: 'category', categoryId: null, expectedVersion: 1 }).success).toBe(false)
    expect(pinSourceSchema.safeParse({ mode: 'standard', categoryId: 'a', expectedVersion: 1 }).success).toBe(false)
    expect(pinSourceSchema.safeParse({ mode: 'individual', categoryId: null }).success).toBe(false)
    expect(pinSourceSchema.safeParse({ mode: 'category', categoryId: 'a', expectedVersion: 1, expectedCategoryRevision: 0 }).success).toBe(true)
  })
})
