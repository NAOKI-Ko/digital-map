import type { PublicMapResponse } from '~~/shared/types/public-map'
import { getLivePublicMapById } from '~~/server/utils/public-map'

export default defineEventHandler(async (event): Promise<PublicMapResponse> => {
  const { map: accessibleMap } = await requireMapAccess(event)
  setResponseHeaders(event, {
    'Cache-Control': 'private, no-store',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    Vary: 'Cookie',
  })
  const map = await getLivePublicMapById(accessibleMap.id, getQuery(event).lang)
  if (!map) throw createError({ statusCode: 404, statusMessage: 'マップが見つかりません。' })
  return { map }
})
