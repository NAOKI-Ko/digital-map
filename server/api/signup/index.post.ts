import { signupSchema } from '~~/shared/schemas/signup'
import { createSignupIntent } from '~~/server/utils/signup'
import { sendTransactionalMail } from '~~/server/utils/mail'

export default defineEventHandler(async (event) => {
  const input = await readValidatedBody(event, signupSchema.parse)
  await enforceRateLimit(event, 'signup', [input.email, rateLimitClientIp(event)], configuredRateLimit('signup'))
  const { intent, rawToken } = await createSignupIntent(input)
  const verificationUrl = `${configuredAdminBaseUrl(event)}/signup/verify?token=${encodeURIComponent(rawToken)}`
  const delivery = await sendTransactionalMail({ purpose: 'SIGNUP_VERIFICATION', to: input.email, url: verificationUrl })
  setResponseStatus(event, 202)
  return { accepted: true, deliveryStatus: delivery.status, ...(useRuntimeConfig(event).deploymentEnvironment !== 'production' && process.env.MAIL_PROVIDER !== 'resend' ? { verificationUrl } : {}) }
})
