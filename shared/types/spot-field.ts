import type { SpotFieldType, StandardSpotFieldKey } from '../constants/spot-fields'
import type { MapLocale } from '../constants/map-languages'

export interface SpotFieldLabelTranslation {
  locale: MapLocale
  label: string | null
}

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
  translations: SpotFieldLabelTranslation[]
}

export interface SpotFieldDefinitionListResponse {
  defaultLocale: MapLocale
  enabledLocales: MapLocale[]
  fields: SpotFieldDefinitionItem[]
}

export interface SpotFieldDefinitionResponse {
  field: SpotFieldDefinitionItem
}
