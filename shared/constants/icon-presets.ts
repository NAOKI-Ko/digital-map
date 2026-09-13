export const materialSymbolPresets = [
  { id: 'material:directions_walk', name: 'directions_walk', label: '観光・散策', group: '観光' },
  { id: 'material:temple_buddhist', name: 'temple_buddhist', label: '寺社', group: '寺社・歴史' },
  { id: 'material:castle', name: 'castle', label: '城・史跡', group: '寺社・歴史' },
  { id: 'material:church', name: 'church', label: '教会', group: '寺社・歴史' },
  { id: 'material:museum', name: 'museum', label: '博物館', group: '文化施設' },
  { id: 'material:festival', name: 'festival', label: 'イベント', group: '文化施設' },
  { id: 'material:park', name: 'park', label: '公園', group: '自然・公園' },
  { id: 'material:forest', name: 'forest', label: '森林', group: '自然・公園' },
  { id: 'material:local_florist', name: 'local_florist', label: '花・植物', group: '自然・公園' },
  { id: 'material:beach_access', name: 'beach_access', label: '水辺', group: '自然・公園' },
  { id: 'material:photo_camera', name: 'photo_camera', label: '写真スポット', group: '写真スポット' },
  { id: 'material:train', name: 'train', label: '駅', group: '交通' },
  { id: 'material:directions_bus', name: 'directions_bus', label: 'バス', group: '交通' },
  { id: 'material:local_parking', name: 'local_parking', label: '駐車場', group: '交通' },
  { id: 'material:wc', name: 'wc', label: 'トイレ', group: '設備' },
  { id: 'material:wifi', name: 'wifi', label: 'Wi-Fi', group: '設備' },
  { id: 'material:local_atm', name: 'local_atm', label: 'ATM', group: '設備' },
  { id: 'material:restaurant', name: 'restaurant', label: '飲食', group: '飲食・買い物' },
  { id: 'material:local_cafe', name: 'local_cafe', label: 'カフェ', group: '飲食・買い物' },
  { id: 'material:icecream', name: 'icecream', label: 'スイーツ', group: '飲食・買い物' },
  { id: 'material:storefront', name: 'storefront', label: '店舗', group: '飲食・買い物' },
  { id: 'material:shopping_bag', name: 'shopping_bag', label: '買い物', group: '飲食・買い物' },
  { id: 'material:hotel', name: 'hotel', label: '宿泊', group: '宿泊' },
  { id: 'material:bed', name: 'bed', label: 'ベッド', group: '宿泊' },
  { id: 'material:hot_tub', name: 'hot_tub', label: '温泉', group: '宿泊' },
  { id: 'material:info', name: 'info', label: '案内所', group: '案内・医療' },
  { id: 'material:medical_services', name: 'medical_services', label: '救護・医療', group: '案内・医療' },
] as const

export type MaterialSymbolPresetId = typeof materialSymbolPresets[number]['id']

export function isMaterialSymbolPresetId(value: string): value is MaterialSymbolPresetId {
  return materialSymbolPresets.some(preset => preset.id === value)
}

export function getMaterialSymbolPreset(value: string | null | undefined) {
  return materialSymbolPresets.find(preset => preset.id === value) ?? null
}
