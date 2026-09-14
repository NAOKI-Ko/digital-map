export default defineEventHandler(async (event) => {
  const { tenant, session } = await requireTenantOwner(event)
  const userId = getRouterParam(event, 'userId')
  if (!userId) throw createError({ statusCode: 400, statusMessage: 'ユーザーIDが必要です。' })
  return removeTenantMember(tenant.id, userId, session.user.id)
})
