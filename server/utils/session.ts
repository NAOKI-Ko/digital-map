import type { H3Event } from 'h3'

export async function requireAdminSession(event: H3Event) {
  const session = await requireUserSession(event)

  if (session.user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'この操作を行う権限がありません。',
    })
  }

  return session
}
