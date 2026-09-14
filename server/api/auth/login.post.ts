import { compare } from 'bcryptjs'
import { loginSchema } from '~~/shared/schemas/auth'

export default defineEventHandler(async (event) => {
  const credentials = await readValidatedBody(event, loginSchema.parse)
  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
  })

  const isValidPassword = user?.isActive
    ? await compare(credentials.password, user.passwordHash)
    : false

  if (!user || !isValidPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'メールアドレスまたはパスワードが正しくありません。',
    })
  }

  const sessionUser = await buildSessionUser(user.id)
  if (!sessionUser) {
    throw createError({ statusCode: 403, statusMessage: '所属する組織がありません。' })
  }

  await setUserSession(event, {
    user: sessionUser,
    loggedInAt: Date.now(),
  })

  return { user: sessionUser }
})
