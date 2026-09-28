import { normalizePinIconType, normalizePinSize, type PinIconType, type PinSize } from '../constants/spot'

export type PinSourceMode = 'standard' | 'category' | 'individual'
export interface PinAppearance {
  pinIconType: PinIconType
  pinIconId: string | null
  pinIconImageUrl: string | null
  pinIconAssetId?: string | null
  pinColor: string
  pinSize: PinSize
}
export interface CategoryPinDefault {
  pinDefaultType?: string | null
  pinDefaultIconId?: string | null
  pinDefaultImageUrl?: string | null
  pinDefaultAssetId?: string | null
  pinDefaultColor?: string | null
  pinDefaultSize?: string | null
  pinDefaultRevision?: number
}
export const standardPinAppearance: Readonly<PinAppearance> = Object.freeze({
  pinIconType: 'preset', pinIconId: 'kanji:●', pinIconImageUrl: null, pinIconAssetId: null,
  pinColor: '#C7401F', pinSize: 'medium',
})
export function categoryPinAppearance(category: CategoryPinDefault | null | undefined): PinAppearance | null {
  if (!category?.pinDefaultType) return null
  return {
    pinIconType: normalizePinIconType(category.pinDefaultType), pinIconId: category.pinDefaultIconId ?? null,
    pinIconImageUrl: category.pinDefaultImageUrl ?? null, pinIconAssetId: category.pinDefaultAssetId ?? null,
    pinColor: category.pinDefaultColor!, pinSize: normalizePinSize(category.pinDefaultSize),
  }
}
/** The only semantic appearance resolver. Published DTOs already contain its concrete output. */
export function resolveEffectivePinAppearance(spot: {
  pinSourceMode?: string
  pinSourceCategory?: CategoryPinDefault | null
  pinIconType: string
  pinIconId: string | null
  pinIconImageUrl: string | null
  pinIconAssetId?: string | null
  pinColor: string
  pinSize?: string | null
}): PinAppearance {
  if (spot.pinSourceMode === 'standard') return { ...standardPinAppearance }
  if (spot.pinSourceMode === 'category') {
    if (!spot.pinSourceCategory) throw new Error('PIN source Category is missing; resolve the source before rendering')
    return categoryPinAppearance(spot.pinSourceCategory) ?? { ...standardPinAppearance }
  }
  // Legacy missing metadata means individual; do not infer from memberships or matching pixels.
  return { pinIconType: normalizePinIconType(spot.pinIconType), pinIconId: spot.pinIconId,
    pinIconImageUrl: spot.pinIconImageUrl, pinIconAssetId: spot.pinIconAssetId,
    pinColor: spot.pinColor, pinSize: normalizePinSize(spot.pinSize) }
}
export function pinSourceLabel(mode?: string, name?: string | null) {
  return mode === 'standard' ? '標準ピン' : mode === 'category' ? `カテゴリー既定：${name ?? ''}` : '個別設定'
}
