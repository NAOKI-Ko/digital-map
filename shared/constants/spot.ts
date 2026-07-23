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

export type PinIconPresetId = typeof pinIconPresets[number]['id']
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
