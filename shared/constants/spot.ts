import { materialSymbolPresets as sharedMaterialSymbolPresets, type MaterialSymbolPresetId } from './icon-presets'

export const kanjiIconPresets = [
  { id: 'kanji:食', legacyId: 'food', label: '飲食', symbol: '食' },
  { id: 'kanji:買', legacyId: 'shopping', label: '買い物', symbol: '買' },
  { id: 'kanji:観', legacyId: 'sightseeing', label: '観光', symbol: '観' },
  { id: 'kanji:♨', legacyId: 'hot-spring', label: '温泉', symbol: '♨' },
  { id: 'kanji:宿', legacyId: 'lodging', label: '宿泊', symbol: '宿' },
  { id: 'kanji:P', legacyId: 'parking', label: '駐車場', symbol: 'P' },
  { id: 'kanji:i', legacyId: 'information', label: '案内', symbol: 'i' },
  { id: 'kanji:●', legacyId: 'default', label: 'その他', symbol: '●' },
] as const

export const pinIconPresets = kanjiIconPresets

export const materialSymbolPresets = sharedMaterialSymbolPresets

export const materialSymbolNames = materialSymbolPresets
  .map(preset => preset.name)
  .toSorted()

export type PinIconPresetId = typeof pinIconPresets[number]['id']
export type { MaterialSymbolPresetId }
export type PinIconId = PinIconPresetId | MaterialSymbolPresetId
export type PinIconFamily = 'kanji' | 'material'
export const pinIconTypes = ['preset', 'custom', 'illustration'] as const
export type PinIconType = typeof pinIconTypes[number]
export const spotImportances = ['normal', 'featured'] as const
export type SpotImportance = typeof spotImportances[number]
export const pinSizes = ['small', 'medium', 'large'] as const
export type PinSize = typeof pinSizes[number]
export function normalizePinSize(value: string | null | undefined): PinSize {
  return value === 'small' || value === 'large' ? value : 'medium'
}

export function normalizeSpotImportance(value: string | null | undefined): SpotImportance {
  return value === 'featured' ? 'featured' : 'normal'
}

export function normalizePinIconType(value: string | null | undefined): PinIconType {
  if (value === 'custom' || value === 'illustration') return value
  return 'preset'
}

export function defaultPinIconId(): PinIconPresetId {
  return 'kanji:●'
}

export function defaultMaterialSymbolId(): MaterialSymbolPresetId {
  return 'material:directions_walk'
}

export function isSupportedPinIconId(id: string) {
  if (materialSymbolPresets.some(preset => preset.id === id)) return true
  return kanjiIconPresets.some(preset =>
    preset.id === id
    || preset.legacyId === id
    || preset.symbol === id,
  )
}

export function getPinIconPreset(id: string | null | undefined) {
  const fallbackId = defaultPinIconId()
  const fallback = kanjiIconPresets.find(preset => preset.id === fallbackId)!

  if (id?.startsWith('material:')) {
    const materialPreset = materialSymbolPresets.find(preset => preset.id === id)
    if (materialPreset) {
      return {
        family: 'material' as const,
        id: materialPreset.id,
        label: materialPreset.label,
        symbol: materialPreset.name,
      }
    }
  }

  const value = id?.startsWith('kanji:') ? id.slice('kanji:'.length) : id
  const kanjiPreset = kanjiIconPresets.find(preset =>
    preset.id === id
    || preset.legacyId === value
    || preset.symbol === value,
  ) ?? fallback

  return {
    family: 'kanji' as const,
    id: kanjiPreset.id,
    label: kanjiPreset.label,
    symbol: kanjiPreset.symbol,
  }
}

export function normalizePinIconId(
  id: string | null | undefined,
): PinIconId {
  return getPinIconPreset(id).id
}
