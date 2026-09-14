import { spotEditorInviteSchema } from '~~/shared/schemas/spot-revision'

export default defineEventHandler(async (event) => {
  const { map, spot, session, isOwner } = await requireOwnedSpot(event)
  if (!isOwner) throw createError({ statusCode: 403, statusMessage: '新しい組織メンバーの招待は組織オーナーだけが作成できます。' })
  const input = await readValidatedBody(event, spotEditorInviteSchema.parse)
  const result = await issueSpotEditorInvitation({ tenantId: map.tenantId, spotId: spot.id, email: input.email, createdById: session.user.id })
  const acceptanceUrl = `${configuredAdminBaseUrl(event)}/invite/accept?token=${encodeURIComponent(result.rawToken)}`
  const delivery = await sendTransactionalMail({ purpose: 'SPOT_EDITOR_INVITATION', to: input.email, url: acceptanceUrl })
  return { invitation: result.invitation, delivery, ...(process.env.NODE_ENV !== 'production' ? { acceptanceUrl } : {}) }
})
