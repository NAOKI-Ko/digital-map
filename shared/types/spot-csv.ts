export type SpotCsvRowStatus = 'NEW' | 'UPDATE' | 'UNCHANGED' | 'CONFLICT' | 'ERROR'
export type SpotCsvClassification = SpotCsvRowStatus | 'WARNING'

export interface SpotCsvMessage {
  level: 'warning' | 'error' | 'conflict'
  message: string
}

export interface SpotCsvFieldDiff {
  field: string
  oldValue: string
  newValue: string
}

export interface SpotCsvPreviewRow {
  rowNumber: number
  spotId: string | null
  name: string
  floorName?: string
  status: SpotCsvRowStatus
  classifications: SpotCsvClassification[]
  messages: SpotCsvMessage[]
  diffs: SpotCsvFieldDiff[]
}

export interface SpotCsvPreview {
  version: 1 | 2 | 3
  total: number
  valid: number
  newCount: number
  updateCount: number
  unchangedCount: number
  warnings: number
  conflicts: number
  errors: number
  rows: SpotCsvPreviewRow[]
}

export interface SpotCsvPreviewResponse { preview: SpotCsvPreview }
export interface SpotCsvImportResponse {
  createdCount: number
  updatedCount: number
  unchangedCount: number
}
