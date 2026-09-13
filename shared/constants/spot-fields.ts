export const standardSpotFieldKeys = ['description', 'address', 'phone', 'website', 'hours', 'holiday'] as const
export type StandardSpotFieldKey = typeof standardSpotFieldKeys[number]

export const customSpotFieldTypes = ['single_line_text', 'multiline_text', 'number', 'url', 'boolean'] as const
export type SpotFieldType = typeof customSpotFieldTypes[number]

export const defaultSpotFieldDefinitions = [
  { kind: 'standard', semanticKey: 'description', label: '紹介文', type: 'multiline_text', enabled: true, publicVisible: true, required: false, order: 0 },
  { kind: 'standard', semanticKey: 'address', label: '住所', type: 'single_line_text', enabled: true, publicVisible: true, required: false, order: 1 },
  { kind: 'standard', semanticKey: 'hours', label: '営業時間', type: 'multiline_text', enabled: true, publicVisible: true, required: false, order: 2 },
  { kind: 'standard', semanticKey: 'holiday', label: '定休日', type: 'multiline_text', enabled: true, publicVisible: true, required: false, order: 3 },
  { kind: 'standard', semanticKey: 'website', label: 'Webサイト', type: 'url', enabled: true, publicVisible: true, required: false, order: 4 },
  { kind: 'standard', semanticKey: 'phone', label: '電話番号', type: 'single_line_text', enabled: false, publicVisible: false, required: false, order: 5 },
] as const
