import type { H3Event } from 'h3'
import { configuredAdminBaseUrl, configuredPublicBaseUrl } from './base-url'

const csrfExempt = new Set([
  '/api/auth/login', '/api/auth/invitations/accept', '/api/auth/password/reset-request', '/api/auth/password/reset',
])

export function trustedRequestOrigins(event: H3Event) {
  const config = useRuntimeConfig(event)
  const requestUrl = getRequestURL(event)
  const configured = String(config.trustedOrigins || '').split(',').map(value => value.trim()).filter(Boolean)
  return new Set([requestUrl.origin, configuredPublicBaseUrl(event), configuredAdminBaseUrl(event), ...configured])
}

export async function enforceCsrfOrigin(event: H3Event) {
  const method = getMethod(event).toUpperCase()
  const path = getRequestURL(event).pathname
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) || csrfExempt.has(path)) return
  const session = await getUserSession(event)
  if (!session.user?.id) return
  const origin = getHeader(event, 'origin')
  if (!origin || !trustedRequestOrigins(event).has(origin)) {
    throw createError({ statusCode: 403, statusMessage: 'リクエスト元を確認できません。' })
  }
}

export const contentSecurityPolicy = [
  "default-src 'self'", "base-uri 'self'", "object-src 'none'", "frame-ancestors 'none'",
  "script-src 'self' 'unsafe-inline'", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com", "img-src 'self' data: blob: https:",
  "connect-src 'self' https://demotiles.maplibre.org https://*.tile.openstreetmap.org", "worker-src 'self' blob:",
].join('; ')
