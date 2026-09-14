import { activatePublicRelease } from '~~/server/utils/public-release'

export default defineEventHandler(async (event) => {
  const { map, session } = await requireMapAccess(event)
  const releaseId = getRouterParam(event, 'releaseId')
  if (!releaseId) throw createError({ statusCode: 400, statusMessage: 'リリースIDが必要です。' })
  const release = await activatePublicRelease(map.id, releaseId, map.tenantId, session.user.id)
  return { currentReleaseId: release.id }
})
