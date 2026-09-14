import { signupResendSchema } from '~~/shared/schemas/signup'
import { createAuthToken } from '~~/server/utils/auth-tokens'
import { signupConfig } from '~~/server/utils/signup'
import { sendTransactionalMail } from '~~/server/utils/mail'

export default defineEventHandler(async (event) => {
  const input = await readValidatedBody(event, signupResendSchema.parse)
  await enforceRateLimit(event, 'signup-resend', [input.email, rateLimitClientIp(event)], configuredRateLimit('signupResend'))
  const intent = await prisma.signupIntent.findFirst({ where: { email: input.email, verifiedAt: null, completedAt: null }, orderBy: { createdAt: 'desc' } })
  let verificationUrl: string | undefined
  if (intent) {
    const token = createAuthToken()
    await prisma.signupIntent.update({ where: { id: intent.id }, data: { verificationTokenHash: token.tokenHash, expiresAt: new Date(Date.now() + signupConfig().verificationTtlMs), verifiedAt: null } })
    verificationUrl = `${configuredPublicBaseUrl()}/signup/verify?token=${encodeURIComponent(token.rawToken)}`
    await sendTransactionalMail({ purpose: 'SIGNUP_VERIFICATION', to: intent.email, url: verificationUrl })
  }
  setResponseStatus(event, 202)
  return { accepted: true, ...(verificationUrl && process.env.NODE_ENV !== 'production' && process.env.MAIL_PROVIDER !== 'resend' ? { verificationUrl } : {}) }
})
