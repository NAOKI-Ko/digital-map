import { passwordResetSchema } from '~~/shared/schemas/auth'

export default defineEventHandler(async (event) => {
  const input = await readValidatedBody(event, passwordResetSchema.parse)
  await consumePasswordReset(input.token, input.password)
  await clearUserSession(event)
  return { changed: true, reloginRequired: true }
})
