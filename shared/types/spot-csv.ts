export interface SpotCsvMessage {
  level: 'warning' | 'error'
  message: string
}

export interface SpotCsvPreviewRow {
  rowNumber: number
  name: string
  messages: SpotCsvMessage[]
}

export interface SpotCsvPreview {
  total: number
  valid: number
  warnings: number
  errors: number
  rows: SpotCsvPreviewRow[]
}

export interface SpotCsvPreviewResponse { preview: SpotCsvPreview }
export interface SpotCsvImportResponse { createdCount: number }
