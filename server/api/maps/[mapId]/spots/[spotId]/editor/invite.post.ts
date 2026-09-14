import { spotEditorInviteSchema } from '~~/shared/schemas/spot-revision'

export default defineEventHandler(async (event) => {
  const { map, spot, session, isOwner } = await requireOwnedSpot(event)
  if (!isOwner) throw createError({ statusCode: 403, statusMessage: '新しい組織メンバーの招待は組織オーナーだけが作成できます。' })
  const input = await readValidatedBody(event, spotEditorInviteSchema.parse)
  const result = await issueSpotEditorInvitation({ tenantId: map.tenantId, spotId: spot.id, email: input.email, createdById: session.user.id })
  return { invitation: result.invitation, acceptanceUrl: `${getRequestURL(event).origin}/invite/accept?token=${encodeURIComponent(result.rawToken)}` }
})
