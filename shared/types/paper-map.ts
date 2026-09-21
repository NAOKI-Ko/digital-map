import type { PaperMapConfig, PaperMapPurpose } from '../schemas/paper-map'
import type { PublicMap } from './public-map'

export interface PaperMapSummary {
  id: string
  mapId: string
  name: string
  configVersion: number
  purpose: PaperMapPurpose
  paper: 'A4' | 'A3'
  orientation: 'portrait' | 'landscape'
  updatedAt: string
  createdAt: string
}

export interface PaperMapRecord extends PaperMapSummary { config: PaperMapConfig }
export interface PaperMapSource { mode: 'LIVE' | 'PUBLISHED', map: PublicMap, spotCount: number, categoryCount: number }
export interface PaperMapListResponse { paperMaps: PaperMapSummary[], source: PaperMapSource }
export interface PaperMapResponse { paperMap: PaperMapRecord, source: PaperMapSource, warnings: string[] }
