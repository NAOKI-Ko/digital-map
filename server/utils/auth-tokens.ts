import { createHash, randomBytes } from 'node:crypto'

export const normalizeAuthEmail = (email: string) => email.trim().toLowerCase()

export const hashAuthToken = (token: string) =>
  createHash('sha256').update(token, 'utf8').digest('hex')

export function createAuthToken() {
  const rawToken = randomBytes(32).toString('base64url')
  return { rawToken, tokenHash: hashAuthToken(rawToken) }
}

export function authLifecycleConfig() {
  const config = useRuntimeConfig()
  return {
    invitationTtlMs: Number(config.auth.invitationTtlHours) * 60 * 60 * 1000,
    passwordResetTtlMs: Number(config.auth.passwordResetTtlMinutes) * 60 * 1000,
  }
}
