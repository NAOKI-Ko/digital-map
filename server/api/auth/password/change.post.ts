import { compare, hash } from 'bcryptjs'
import { passwordChangeSchema } from '~~/shared/schemas/auth'

export default defineEventHandler(async (event) => {
  const session = await requireUser(event)
  const input = await readValidatedBody(event, passwordChangeSchema.parse)
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { passwordHash: true } })
  if (!user || !await compare(input.currentPassword, user.passwordHash)) {
    throw createError({ statusCode: 401, statusMessage: '現在のパスワードが正しくありません。' })
  }
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: await hash(input.newPassword, 12), authVersion: { increment: 1 } },
  })
  await clearUserSession(event)
  return { changed: true, reloginRequired: true }
})
