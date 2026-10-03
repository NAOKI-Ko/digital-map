import fixture from '../../../fixtures/arimatsu-public.json'
import type { PublicMapResponse } from '~~/shared/types/public-map'

// Development-only long-content flow. It never reads or writes publication data.
export default defineEventHandler(() => {
  if (!import.meta.dev) throw createError({ statusCode: 404 })
  const response = structuredClone(fixture) as PublicMapResponse
  response.map.slug = '__qa_arimatsu'
  for (const floor of response.map.floors) {
    for (const spot of floor.spots) {
      spot.description = Array.from({ length: 12 }, () => spot.description || '散策途中の立ち寄り先です。').join('\n')
    }
  }
  return response
})
