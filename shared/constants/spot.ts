export const spotCategorySuggestions = [
  '飲食',
  '買い物',
  '観光',
  '温泉',
  '宿泊',
  '駐車場',
  '公共施設',
  'その他',
] as const

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

export const materialSymbolPresets = [
  { id: 'material:restaurant', name: 'restaurant', label: 'レストラン' },
  { id: 'material:local_cafe', name: 'local_cafe', label: 'カフェ' },
  { id: 'material:icecream', name: 'icecream', label: 'アイスクリーム' },
  { id: 'material:hotel', name: 'hotel', label: 'ホテル' },
  { id: 'material:bed', name: 'bed', label: 'ベッド' },
  { id: 'material:hot_tub', name: 'hot_tub', label: '温泉' },
  { id: 'material:storefront', name: 'storefront', label: '店舗' },
  { id: 'material:shopping_bag', name: 'shopping_bag', label: '買い物' },
  { id: 'material:museum', name: 'museum', label: '博物館' },
  { id: 'material:church', name: 'church', label: '教会' },
  { id: 'material:castle', name: 'castle', label: '城' },
  { id: 'material:park', name: 'park', label: '公園' },
  { id: 'material:forest', name: 'forest', label: '森林' },
  { id: 'material:local_florist', name: 'local_florist', label: '花・植物' },
  { id: 'material:beach_access', name: 'beach_access', label: '海水浴' },
  { id: 'material:wc', name: 'wc', label: 'トイレ' },
  { id: 'material:local_parking', name: 'local_parking', label: '駐車場' },
  { id: 'material:local_atm', name: 'local_atm', label: 'ATM' },
  { id: 'material:festival', name: 'festival', label: 'イベント' },
  { id: 'material:photo_camera', name: 'photo_camera', label: '撮影スポット' },
  { id: 'material:directions_walk', name: 'directions_walk', label: '散策' },
] as const

export const materialSymbolNames = materialSymbolPresets
  .map(preset => preset.name)
  .toSorted()

export type PinIconPresetId = typeof pinIconPresets[number]['id']
export type MaterialSymbolPresetId = typeof materialSymbolPresets[number]['id']
export type PinIconId = PinIconPresetId | MaterialSymbolPresetId
export type PinIconFamily = 'kanji' | 'material'
export const pinIconTypes = ['preset', 'custom', 'illustration'] as const
export type PinIconType = typeof pinIconTypes[number]

export function normalizePinIconType(value: string | null | undefined): PinIconType {
  if (value === 'custom' || value === 'illustration') return value
  return 'preset'
}

export function defaultPinIconId(category: string): PinIconPresetId {
  const mapping: Record<string, PinIconPresetId> = {
    '飲食': 'kanji:食',
    '買い物': 'kanji:買',
    '観光': 'kanji:観',
    '温泉': 'kanji:♨',
    '宿泊': 'kanji:宿',
    '駐車場': 'kanji:P',
    '公共施設': 'kanji:i',
  }
  return mapping[category] ?? 'kanji:●'
}

export function defaultMaterialSymbolId(category: string): MaterialSymbolPresetId {
  const mapping: Record<string, MaterialSymbolPresetId> = {
    '飲食': 'material:restaurant',
    '買い物': 'material:storefront',
    '観光': 'material:museum',
    '温泉': 'material:hot_tub',
    '宿泊': 'material:hotel',
    '駐車場': 'material:local_parking',
    '公共施設': 'material:wc',
  }
  return mapping[category] ?? 'material:directions_walk'
}

export function isSupportedPinIconId(id: string) {
  if (materialSymbolPresets.some(preset => preset.id === id)) return true
  return kanjiIconPresets.some(preset =>
    preset.id === id
    || preset.legacyId === id
    || preset.symbol === id,
  )
}

export function getPinIconPreset(id: string | null | undefined, category = '') {
  const fallbackId = defaultPinIconId(category)
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
  category = '',
): PinIconId {
  return getPinIconPreset(id, category).id
}
