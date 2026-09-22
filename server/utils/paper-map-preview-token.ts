import { createHash } from 'node:crypto'
import type { PaperMapConfig } from '~~/shared/schemas/paper-map'
import type { PaperMapSource } from '~~/shared/types/paper-map'

// An optimistic freshness check, not an authorization token. Access is checked separately.
export function paperMapPreviewToken(source: PaperMapSource, config: PaperMapConfig) {
  return createHash('sha256').update(JSON.stringify({ source, config })).digest('hex')
}
