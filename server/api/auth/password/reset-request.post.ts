import { passwordResetRequestSchema } from '~~/shared/schemas/auth'

export default defineEventHandler(async (event) => {
  const input = await readValidatedBody(event, passwordResetRequestSchema.parse)
  await enforceRateLimit(event, 'password-reset', [input.email, rateLimitClientIp(event)], configuredRateLimit('passwordReset'))
  const issued = await issuePasswordReset(input.email)
  const response: { accepted: true, resetUrl?: string } = { accepted: true }
  if (issued) {
    const resetUrl = `${configuredAdminBaseUrl(event)}/reset-password?token=${encodeURIComponent(issued.rawToken)}`
    await sendTransactionalMail({ purpose: 'PASSWORD_RESET', to: input.email, url: resetUrl })
    if (process.env.NODE_ENV !== 'production') response.resetUrl = resetUrl
  }
  return response
})
