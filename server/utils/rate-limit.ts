import { createHash } from 'node:crypto'
import type { H3Event } from 'h3'

export interface RateLimitRule { limit: number, windowSeconds: number }

export function rateLimitKey(namespace: string, dimensions: string[], windowSeconds: number, now = Date.now()) {
  const windowNumber = Math.floor(now / (windowSeconds * 1000))
  return createHash('sha256').update([namespace, ...dimensions, String(windowNumber)].join('\u001f')).digest('hex')
}

export function rateLimitClientIp(event: H3Event) {
  return getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
}

export async function consumeRateLimit(namespace: string, dimensions: string[], rule: RateLimitRule, now = new Date()) {
  const key = rateLimitKey(namespace, dimensions, rule.windowSeconds, now.getTime())
  const windowEnd = new Date((Math.floor(now.getTime() / (rule.windowSeconds * 1000)) + 1) * rule.windowSeconds * 1000)
  const bucket = await prisma.rateLimitBucket.upsert({
    where: { key }, create: { key, namespace, count: 1, windowEnd }, update: { count: { increment: 1 } }, select: { count: true, windowEnd: true },
  })
  return { allowed: bucket.count <= rule.limit, remaining: Math.max(0, rule.limit - bucket.count), retryAfterSeconds: Math.max(1, Math.ceil((bucket.windowEnd.getTime() - now.getTime()) / 1000)) }
}

export async function enforceRateLimit(event: H3Event, namespace: string, dimensions: string[], rule: RateLimitRule) {
  const result = await consumeRateLimit(namespace, dimensions, rule)
  setHeader(event, 'X-RateLimit-Remaining', String(result.remaining))
  if (!result.allowed) {
    setHeader(event, 'Retry-After', result.retryAfterSeconds)
    throw createError({ statusCode: 429, statusMessage: 'しばらく待ってから再試行してください。' })
  }
  return result
}

export function configuredRateLimit(name: 'loginFailures' | 'passwordReset' | 'inviteAcceptance'): RateLimitRule {
  const rule = useRuntimeConfig().rateLimits[name]
  return { limit: Number(rule.limit), windowSeconds: Number(rule.windowSeconds) }
}
