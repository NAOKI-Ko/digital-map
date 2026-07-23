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

export const pinIconPresets = [
  { id: 'food', label: '飲食', symbol: '食' },
  { id: 'shopping', label: '買い物', symbol: '買' },
  { id: 'sightseeing', label: '観光', symbol: '観' },
  { id: 'hot-spring', label: '温泉', symbol: '♨' },
  { id: 'lodging', label: '宿泊', symbol: '宿' },
  { id: 'parking', label: '駐車場', symbol: 'P' },
  { id: 'information', label: '案内', symbol: 'i' },
  { id: 'default', label: 'その他', symbol: '●' },
] as const

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
export const pinIconTypes = ['preset', 'custom', 'illustration'] as const
export type PinIconType = typeof pinIconTypes[number]

export function normalizePinIconType(value: string | null | undefined): PinIconType {
  if (value === 'custom' || value === 'illustration') return value
  return 'preset'
}

export function getPinIconPreset(id: string | null | undefined) {
  return pinIconPresets.find(preset => preset.id === id) ?? pinIconPresets.at(-1)!
}

export function defaultPinIconId(category: string): PinIconPresetId {
  const mapping: Record<string, PinIconPresetId> = {
    '飲食': 'food',
    '買い物': 'shopping',
    '観光': 'sightseeing',
    '温泉': 'hot-spring',
    '宿泊': 'lodging',
    '駐車場': 'parking',
    '公共施設': 'information',
  }
  return mapping[category] ?? 'default'
}
