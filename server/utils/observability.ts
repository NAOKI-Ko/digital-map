import { createHash } from 'node:crypto'
import type { H3Event } from 'h3'

type LogLevel = 'info' | 'warn' | 'error'
const sensitiveKey = /(password|secret|token|cookie|authorization|api.?key|body|headers)/i

export function sanitizeOperationalValue(value: unknown): unknown {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
    return typeof value === 'string' ? value.replace(/(token|password|secret)=([^&\s]+)/gi, '$1=[REDACTED]') : value
  }
  if (Array.isArray(value)) return value.map(sanitizeOperationalValue)
  if (typeof value === 'object') return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !sensitiveKey.test(key)).map(([key, child]) => [key, sanitizeOperationalValue(child)]))
  return String(value)
}

export function operationalLog(level: LogLevel, input: { event?: H3Event, route?: string, action?: string, tenantId?: string, mapId?: string, code?: string, message?: string }) {
  const entry = sanitizeOperationalValue({
    timestamp: new Date().toISOString(), level, requestId: input.event ? requestIdFor(input.event) : undefined,
    route: input.route, action: input.action, tenantId: input.tenantId, mapId: input.mapId,
    code: input.code, message: input.message,
  })
  const line = process.env.NODE_ENV === 'production' ? JSON.stringify(entry) : `[${level}] ${JSON.stringify(entry)}`
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.info(line)
}

const recentAlerts = new Map<string, number>()

export async function notifyOperations(input: { code: string, message: string, requestId?: string, route?: string }, now = Date.now()) {
  const config = useRuntimeConfig()
  if (!config.opsAlertWebhookUrl) return { sent: false, reason: 'not_configured' as const }
  const sanitized = sanitizeOperationalValue(input) as Record<string, string>
  const fingerprint = createHash('sha256').update(`${sanitized.code}:${sanitized.route ?? ''}`).digest('hex')
  if ((recentAlerts.get(fingerprint) ?? 0) > now - 5 * 60 * 1000) return { sent: false, reason: 'deduplicated' as const }
  recentAlerts.set(fingerprint, now)
  try {
    await fetch(String(config.opsAlertWebhookUrl), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...sanitized, fingerprint }) })
    return { sent: true as const }
  }
  catch {
    operationalLog('warn', { action: 'ops_alert', code: 'delivery_failed', message: 'Operations alert delivery failed.' })
    return { sent: false, reason: 'delivery_failed' as const }
  }
}

export function resetAlertDedupeForTest() { recentAlerts.clear() }
