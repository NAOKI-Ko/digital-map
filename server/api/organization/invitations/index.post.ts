import { organizationInvitationSchema } from '~~/shared/schemas/organization'

export default defineEventHandler(async (event) => {
  const { session, tenant } = await requireTenantOwner(event)
  const input = await readValidatedBody(event, organizationInvitationSchema.parse)
  const result = await issueOrganizationInvitation({ tenantId: tenant.id, email: input.email, createdById: session.user.id })
  const baseUrl = getRequestURL(event).origin
  return {
    invitation: result.invitation,
    acceptanceUrl: `${baseUrl}/invite/accept?token=${encodeURIComponent(result.rawToken)}`,
  }
})
