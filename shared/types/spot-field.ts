import type { SpotFieldType, StandardSpotFieldKey } from '../constants/spot-fields'

export interface SpotFieldDefinitionItem {
  id: string
  kind: 'standard' | 'custom'
  semanticKey: StandardSpotFieldKey | null
  label: string
  type: SpotFieldType
  enabled: boolean
  publicVisible: boolean
  required: boolean
  order: number
  valueCount: number
  englishLabel?: string | null
}

export interface SpotFieldDefinitionListResponse {
  fields: SpotFieldDefinitionItem[]
}

export interface SpotFieldDefinitionResponse {
  field: SpotFieldDefinitionItem
}
