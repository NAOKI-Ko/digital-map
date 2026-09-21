import type { PaperMapConfig, PaperMapPurpose } from '../schemas/paper-map'
import { defaultPaperMapConfig } from './paper-map-templates'

export function recommendPaperMapConfig(purpose: PaperMapPurpose, spotCount: number, title: string): PaperMapConfig {
  return defaultPaperMapConfig(purpose === 'MAP_FOCUS' ? 'map-classic' : purpose === 'PHOTO_GUIDE' ? 'photo-story' : 'spot-guide', spotCount, title)
}

export function recommendedSpotLimit(config: Pick<PaperMapConfig, 'paper' | 'presentation'>) {
  const base = config.paper === 'A3' ? 120 : 80
  return config.presentation.informationDensity === 'detail' ? Math.round(base * 0.5) : config.presentation.informationDensity === 'standard' ? base : Math.round(base * 1.5)
}
