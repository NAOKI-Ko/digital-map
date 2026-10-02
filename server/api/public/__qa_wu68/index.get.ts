import fixture from '../../../fixtures/arimatsu-public.json'
import type { PublicMapResponse } from '~~/shared/types/public-map'

// Development-only deterministic density fixture; no DB or publication writes.
export function createWu68Fixture(mode: 'dense' | 'coincident' | 'empty' | 'invalid' | 'broad' | 'dateline' | 'near' = 'dense'): PublicMapResponse {
  if (!import.meta.dev) throw createError({ statusCode: 404 })
  const response = structuredClone(fixture) as PublicMapResponse
  response.map.slug = '__qa_arimatsu'
  response.map.name = 'WU-68 高密度 outdoor'
  response.map.logoUrl = null
  const floor = response.map.floors[0]!
  const sample = floor.spots[0]!
  floor.spots = Array.from({ length: 36 }, (_, index) => ({
    ...structuredClone(sample), id: `wu68-${String(index).padStart(2, '0')}`,
    name: `Spot ${String(index).padStart(2, '0')}`, photos: [],
    x: 0.3 + (index % 6) * 0.06, y: 0.3 + Math.floor(index / 6) * 0.06,
    importance: index % 3 === 0 ? 'featured' : 'normal',
    pinIconType: 'preset', pinIconId: 'shop', pinIconImageUrl: null,
    pinSize: (['small', 'medium', 'large'] as const)[index % 3]!,
  }))
  if (mode === 'coincident') floor.spots = floor.spots.slice(0, 3).map(spot => ({ ...spot, x: .5, y: .5, categories: [] }))
  if (mode === 'dateline') Object.assign(floor, { refAImageX: 0, refAImageY: 0, refALat: 35, refALng: 179.99, refBImageX: .25, refBImageY: 0, refBLat: 35, refBLng: 179.995 })
  if (mode === 'broad') floor.spots = [{ ...floor.spots[0]!, x: .1, y: .1 }, { ...floor.spots[1]!, x: .9, y: .9, importance: 'featured' }]
  if (mode === 'near') floor.spots = floor.spots.slice(0,3).map((spot,index) => ({ ...spot, x: .5+index*.000001, y: .5, categories: [] }))
  if (mode === 'empty') floor.spots = []
  if (mode === 'invalid') floor.spots = [{ ...floor.spots[0]!, x: 2 }]
  return response
}
export default defineEventHandler(() => createWu68Fixture())
