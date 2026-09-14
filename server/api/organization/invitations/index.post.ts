import { organizationInvitationSchema } from '~~/shared/schemas/organization'

export default defineEventHandler(async (event) => {
  const { session, tenant } = await requireTenantOwner(event)
  const input = await readValidatedBody(event, organizationInvitationSchema.parse)
  const result = await issueOrganizationInvitation({ tenantId: tenant.id, email: input.email, createdById: session.user.id })
  const acceptanceUrl = `${configuredPublicBaseUrl()}/invite/accept?token=${encodeURIComponent(result.rawToken)}`
  const delivery = await sendTransactionalMail({ purpose: 'ORGANIZATION_INVITATION', to: input.email, url: acceptanceUrl })
  return {
    invitation: result.invitation,
    delivery,
    ...(process.env.NODE_ENV !== 'production' ? { acceptanceUrl } : {}),
  }
})
