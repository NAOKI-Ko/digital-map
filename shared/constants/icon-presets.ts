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

export type MaterialSymbolPresetId = typeof materialSymbolPresets[number]['id']

export function isMaterialSymbolPresetId(value: string): value is MaterialSymbolPresetId {
  return materialSymbolPresets.some(preset => preset.id === value)
}

export function getMaterialSymbolPreset(value: string | null | undefined) {
  return materialSymbolPresets.find(preset => preset.id === value) ?? null
}
