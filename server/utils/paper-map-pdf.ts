import type { PaperMapConfig } from '~~/shared/schemas/paper-map'
import type { PaperMapSource } from '~~/shared/types/paper-map'
import { generateLegacyPaperMapPdf as generateLegacyPdf } from './paper-map-pdf-v1'
import { generatePaperDocumentPdf, type PaperRenderOptions } from './paper-map-document-renderer'

export async function generatePaperMapPdf(source: PaperMapSource, config: PaperMapConfig, options: PaperRenderOptions) {
  return config.templateVersion === 1 ? generateLegacyPdf(source, config, options) : generatePaperDocumentPdf(source, config, options)
}
