import { passwordResetRequestSchema } from '~~/shared/schemas/auth'

export default defineEventHandler(async (event) => {
  const input = await readValidatedBody(event, passwordResetRequestSchema.parse)
  const issued = await issuePasswordReset(input.email)
  const response: { accepted: true, resetUrl?: string } = { accepted: true }
  if (issued && process.env.NODE_ENV !== 'production') {
    response.resetUrl = `${getRequestURL(event).origin}/reset-password?token=${encodeURIComponent(issued.rawToken)}`
  }
  return response
})
