import { mapPublicationSchema } from '~~/shared/schemas/map-publication'
import type { MapPublicationResponse } from '~~/shared/types/map-publication'

export default defineEventHandler(async (event): Promise<MapPublicationResponse> => {
  const session = await requireAdminSession(event)
  const mapId = getRouterParam(event, 'mapId')
  const input = await readValidatedBody(event, mapPublicationSchema.parse)

  if (!mapId) {
    throw createError({ statusCode: 400, statusMessage: 'マップIDが必要です。' })
  }

  const map = await setOwnedMapPublication(mapId, session.user.tenantId, input.isPublished)
  if (!map) {
    throw createError({ statusCode: 404, statusMessage: 'マップが見つかりません。' })
  }

  return {
    publication: {
      id: map.id,
      name: map.name,
      slug: map.slug,
      isPublished: map.isPublished,
      updatedAt: map.updatedAt.toISOString(),
    },
  }
})
