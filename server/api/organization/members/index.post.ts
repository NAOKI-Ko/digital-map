import { addOrganizationMemberSchema } from '~~/shared/schemas/organization'

export default defineEventHandler(async (event) => {
  const { session, tenant } = await requireTenantOwner(event)
  const input = await readValidatedBody(event, addOrganizationMemberSchema.parse)
  const result = await issueOrganizationInvitation({ tenantId: tenant.id, email: input.email, createdById: session.user.id })
  return {
    invitation: result.invitation,
    acceptanceUrl: `${getRequestURL(event).origin}/invite/accept?token=${encodeURIComponent(result.rawToken)}`,
  }
})
