import { acceptInvitationSchema } from '~~/shared/schemas/auth'

export default defineEventHandler(async (event) => {
  const input = await readValidatedBody(event, acceptInvitationSchema.parse)
  await enforceRateLimit(event, 'invite-acceptance', [rateLimitClientIp(event), hashAuthToken(input.token).slice(0, 16)], configuredRateLimit('inviteAcceptance'))
  const session = await getUserSession(event)
  const result = await acceptOrganizationInvitation({
    rawToken: input.token,
    password: input.password,
    authenticatedUserId: session.user?.id,
  })
  return { accepted: true, tenantId: result.tenantId }
})
