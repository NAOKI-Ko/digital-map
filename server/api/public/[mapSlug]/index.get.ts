import { getPublicMapBySlug } from '~~/server/utils/public-map'
import type { PublicMapResponse } from '~~/shared/types/public-map'

export default defineEventHandler(async (event): Promise<PublicMapResponse> => {
  const mapSlug = getRouterParam(event, 'mapSlug')?.trim()
  if (!mapSlug) {
    throw createError({ statusCode: 400, statusMessage: 'マップslugが必要です。' })
  }

  const map = await getPublicMapBySlug(mapSlug)
  if (!map) {
    throw createError({ statusCode: 404, statusMessage: '公開マップが見つかりません。' })
  }

  return { map }
})
