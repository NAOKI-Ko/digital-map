import { organizationSwitchSchema } from '~~/shared/schemas/organization'

export default defineEventHandler(async (event) => {
  const session = await requireUser(event)
  const input = await readValidatedBody(event, organizationSwitchSchema.parse)
  await requireTenantMember(event, input.tenantId)
  const user = await buildSessionUser(session.user.id, input.tenantId)
  if (!user) throw createError({ statusCode: 403, statusMessage: 'この組織には所属していません。' })
  await setUserSession(event, { user, loggedInAt: session.loggedInAt })
  return { user }
})

