import { completeExistingSignupSchema } from '~~/shared/schemas/signup'
import { completeExistingSignup } from '~~/server/utils/signup'

export default defineEventHandler(async (event) => {
  const session = await requireUser(event)
  const input = await readValidatedBody(event, completeExistingSignupSchema.parse)
  const tenant = await completeExistingSignup(session.user.id, input.intentId)
  const user = await buildSessionUser(session.user.id, tenant.id)
  if (!user) throw createError({ statusCode: 500, statusMessage: '組織セッションを作成できません。' })
  await setUserSession(event, { user, loggedInAt: session.loggedInAt })
  return { redirect: '/admin/maps/new?onboarding=1' }
})
