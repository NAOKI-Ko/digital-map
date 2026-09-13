import { updateOrganizationMemberSchema } from '~~/shared/schemas/organization'

export default defineEventHandler(async (event) => {
  const { tenant } = await requireTenantOwner(event)
  const userId = getRouterParam(event, 'userId')
  const input = await readValidatedBody(event, updateOrganizationMemberSchema.parse)
  if (!userId) throw createError({ statusCode: 400, statusMessage: 'ユーザーIDが必要です。' })
  const membership = await changeTenantMemberRole(tenant.id, userId, input.role)
  return { membership }
})
