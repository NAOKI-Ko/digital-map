import { mapPublicationSchema } from '~~/shared/schemas/map-publication'
import type { MapPublicationResponse } from '~~/shared/types/map-publication'

export default defineEventHandler(async (event): Promise<MapPublicationResponse> => {
  const { map: accessibleMap, session } = await requireMapAccess(event)
  const input = await readValidatedBody(event, mapPublicationSchema.parse)

  const map = await setOwnedMapPublication(accessibleMap.id, accessibleMap.tenantId, input.isPublished, session.user.id)
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
