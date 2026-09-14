import { mapPublicationSchema } from '~~/shared/schemas/map-publication'
import type { MapPublicationResponse } from '~~/shared/types/map-publication'
import { activatePublicRelease, buildPublicRelease, unpublishCurrentMap } from '~~/server/utils/public-release'

export default defineEventHandler(async (event): Promise<MapPublicationResponse> => {
  const { map: accessibleMap, session } = await requireMapAccess(event)
  const input = await readValidatedBody(event, mapPublicationSchema.parse)

  let releaseId: string | null = null
  if (input.isPublished) {
    const release = await buildPublicRelease(accessibleMap.id, session.user.id, getUploadDirectory(event))
    await activatePublicRelease(accessibleMap.id, release.id, accessibleMap.tenantId, session.user.id)
    releaseId = release.id
  }
  else await unpublishCurrentMap(accessibleMap.id, accessibleMap.tenantId, session.user.id)
  const map = await prisma.map.findUnique({ where: { id: accessibleMap.id }, select: { id: true, name: true, slug: true, isPublished: true, updatedAt: true, currentReleaseId: true } })
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
      releaseId: releaseId ?? map.currentReleaseId,
    },
  }
})
