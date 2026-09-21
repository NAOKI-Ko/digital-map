import type { PaperMapConfig, PaperMapPurpose } from '../schemas/paper-map'

export function recommendPaperMapConfig(purpose: PaperMapPurpose, spotCount: number, title: string): PaperMapConfig {
  const busy = spotCount > 40
  const compact = spotCount > 80
  return {
    purpose, sourceMode: 'LIVE',
    paper: compact ? 'A3' : 'A4',
    orientation: purpose === 'MAP_FOCUS' ? 'landscape' : 'portrait',
    layout: purpose === 'MAP_FOCUS' ? 'MAP_FOCUS' : purpose === 'PHOTO_GUIDE' ? 'GUIDE' : 'BALANCED',
    mapSize: purpose === 'MAP_FOCUS' ? 'large' : purpose === 'PHOTO_GUIDE' ? 'info' : 'standard',
    selectionMode: 'recommended', categoryIds: [], spotIds: [],
    density: compact ? 'names' : busy ? 'standard' : 'detail',
    photos: purpose === 'PHOTO_GUIDE' ? 'featured' : 'none',
    order: 'auto', manualSpotIds: [], qrEnabled: true, qrLabel: '詳しい情報はWebマップで',
    logoEnabled: true, theme: 'brand', viewport: { mode: 'fit_spots' }, title, subtitle: '',
  }
}

export function recommendedSpotLimit(config: Pick<PaperMapConfig, 'paper' | 'density'>) {
  const base = config.paper === 'A3' ? 120 : 80
  return config.density === 'detail' ? Math.round(base * 0.5) : config.density === 'standard' ? base : Math.round(base * 1.5)
}
