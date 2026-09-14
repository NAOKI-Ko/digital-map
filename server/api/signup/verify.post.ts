import { signupVerificationSchema } from '~~/shared/schemas/signup'
import { verifySignupToken } from '~~/server/utils/signup'

export default defineEventHandler(async (event) => {
  const input = await readValidatedBody(event, signupVerificationSchema.parse)
  const result = await verifySignupToken(input.token)
  if (!result.requiresLogin) {
    const user = await buildSessionUser(result.userId, result.tenantId ?? undefined)
    if (!user) throw createError({ statusCode: 500, statusMessage: '登録後のセッションを作成できません。' })
    await setUserSession(event, { user, loggedInAt: Date.now() })
  }
  return { requiresLogin: result.requiresLogin, intentId: result.intentId, redirect: result.requiresLogin ? `/admin/login?redirect=${encodeURIComponent(`/admin/signup/complete?intent=${result.intentId}`)}` : '/admin/maps/new?onboarding=1' }
})
