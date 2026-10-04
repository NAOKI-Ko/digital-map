import { requireWorkspaceSpot } from '~~/server/utils/workspace-spot'
import { approveSpotRevision } from '~~/server/utils/spot-revision'
export default defineEventHandler(async event => {
  const { session, spot } = await requireWorkspaceSpot(event)
  if (!spot.schemaMapId) throw createError({ statusCode: 409, statusMessage: '項目の定義を確認してください。' })
  const revisionId = getRouterParam(event, 'revisionId')
  if (!revisionId || !await prisma.spotRevision.count({ where: { id: revisionId, spotId: spot.id } })) throw createError({ statusCode: 404, statusMessage: 'Revisionが見つかりません。' })
  return { revision: await approveSpotRevision(event, revisionId, { session, map: { id: spot.schemaMapId, tenantId: spot.tenantId }, isOwner: true, canonicalSpotId: spot.id }) }
})
