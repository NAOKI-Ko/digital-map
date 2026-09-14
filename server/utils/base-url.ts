import type { H3Event } from 'h3'

export function normalizeBaseUrl(value: unknown) {
  const url = new URL(String(value))
  url.pathname = url.pathname.replace(/\/$/, '') || '/'
  url.search = ''
  url.hash = ''
  return url.toString().replace(/\/$/, '')
}

export function validateProductionBaseUrl(name: 'PUBLIC_BASE_URL' | 'ADMIN_BASE_URL', value: unknown) {
  let url: URL
  try { url = new URL(String(value)) }
  catch { throw new Error(`${name} must be an absolute URL`) }
  const hostname = url.hostname.toLowerCase()
  if (url.protocol !== 'https:') throw new Error(`${name} must use HTTPS in production`)
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname.endsWith('.localhost')) throw new Error(`${name} must not use localhost in production`)
  if (hostname === 'trycloudflare.com' || hostname.endsWith('.trycloudflare.com')) throw new Error(`${name} must not use a Quick Tunnel in production`)
  if (url.username || url.password) throw new Error(`${name} must not contain credentials`)
  return normalizeBaseUrl(url)
}

export function configuredPublicBaseUrl(event?: H3Event) { return normalizeBaseUrl(useRuntimeConfig(event).publicBaseUrl) }
export function configuredAdminBaseUrl(event?: H3Event) {
  const config = useRuntimeConfig(event)
  return normalizeBaseUrl(config.adminBaseUrl || config.publicBaseUrl)
}

export function configuredTrustedHosts(event: H3Event) {
  const config = useRuntimeConfig(event)
  return new Set([
    new URL(configuredPublicBaseUrl(event)).host,
    new URL(configuredAdminBaseUrl(event)).host,
    ...String(config.trustedHosts || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean),
  ])
}

export function effectiveRequestProtocol(event: H3Event) {
  const config = useRuntimeConfig(event)
  if (config.trustProxy) {
    const forwarded = getHeader(event, 'x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase()
    if (forwarded === 'https' || forwarded === 'http') return `${forwarded}:`
  }
  return getRequestURL(event).protocol
}

export function effectiveRequestHost(event: H3Event) {
  const config = useRuntimeConfig(event)
  if (config.trustProxy) return getHeader(event, 'x-forwarded-host')?.split(',')[0]?.trim().toLowerCase() || getRequestURL(event).host.toLowerCase()
  return getRequestURL(event).host.toLowerCase()
}
