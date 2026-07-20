import { compare } from 'bcryptjs'
import { loginSchema } from '~~/shared/schemas/auth'

export default defineEventHandler(async (event) => {
  const credentials = await readValidatedBody(event, loginSchema.parse)
  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
  })

  const isValidPassword = user
    ? await compare(credentials.password, user.passwordHash)
    : false

  if (!user || !isValidPassword || user.role !== 'admin') {
    throw createError({
      statusCode: 401,
      statusMessage: 'メールアドレスまたはパスワードが正しくありません。',
    })
  }

  const sessionUser = {
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    role: 'admin' as const,
  }

  await setUserSession(event, {
    user: sessionUser,
    loggedInAt: Date.now(),
  })

  return { user: sessionUser }
})
