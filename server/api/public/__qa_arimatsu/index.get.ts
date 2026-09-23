import fixture from '../../../fixtures/arimatsu-public.json'
import type { PublicMapResponse } from '~~/shared/types/public-map'

export default defineEventHandler((): PublicMapResponse => {
  if (!import.meta.dev) throw createError({ statusCode: 404 })
  return fixture as PublicMapResponse
})
