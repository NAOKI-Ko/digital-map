import { loadCurrentPublicSnapshot } from '~~/server/utils/public-release'
import type { PublicMapResponse } from '~~/shared/types/public-map'

export default defineEventHandler(async (event): Promise<PublicMapResponse> => {
  const mapSlug = getRouterParam(event, 'mapSlug')?.trim()
  if (!mapSlug) {
    throw createError({ statusCode: 400, statusMessage: 'マップslugが必要です。' })
  }

  const map = await loadCurrentPublicSnapshot(mapSlug, getQuery(event).lang)
  if (!map) {
    throw createError({ statusCode: 404, statusMessage: '公開マップが見つかりません。' })
  }

  setHeader(event, 'Cache-Control', 'no-cache, max-age=0, must-revalidate')

  return { map }
})
