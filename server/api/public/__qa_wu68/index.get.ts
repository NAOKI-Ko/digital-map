import fixture from '../../../fixtures/arimatsu-public.json'
import type { PublicMapResponse } from '~~/shared/types/public-map'

// Development-only deterministic density fixture; no DB or publication writes.
export default defineEventHandler((): PublicMapResponse => {
  if (!import.meta.dev) throw createError({ statusCode: 404 })
  const response = structuredClone(fixture) as PublicMapResponse
  response.map.slug = '__qa_arimatsu'
  response.map.name = 'WU-68 高密度 outdoor'
  response.map.logoUrl = null
  const floor = response.map.floors[0]!
  const sample = floor.spots[0]!
  floor.spots = Array.from({ length: 36 }, (_, index) => ({
    ...structuredClone(sample), id: `wu68-${String(index).padStart(2, '0')}`,
    name: `Spot ${String(index).padStart(2, '0')}`,
    x: 0.3 + (index % 6) * 0.06, y: 0.3 + Math.floor(index / 6) * 0.06,
    importance: index % 3 === 0 ? 'featured' : 'normal',
    pinIconType: 'preset', pinIconId: 'shop', pinIconImageUrl: null,
    pinSize: (['small', 'medium', 'large'] as const)[index % 3]!,
  }))
  return response
})
