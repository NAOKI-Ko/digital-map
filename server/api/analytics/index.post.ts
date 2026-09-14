import { z } from 'zod'
import { analyticsBuffer, consumeAnalyticsRateLimit } from '~~/server/utils/analytics'
import { rateLimitClientIp } from '~~/server/utils/rate-limit'

const schema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('MAP_VIEW'), mapId: z.string().min(1).max(100) }).strict(),
  z.object({ type: z.literal('SPOT_VIEW'), mapId: z.string().min(1).max(100), spotId: z.string().min(1).max(100) }).strict(),
])
const botPattern = /bot|crawler|spider|slurp|headless/i

export default defineEventHandler(async (event) => {
  if (botPattern.test(getHeader(event, 'user-agent') ?? '')) return { accepted: false }
  if (!consumeAnalyticsRateLimit(rateLimitClientIp(event))) throw createError({ statusCode: 429, statusMessage: 'Rate limit exceeded.' })
  const result = schema.safeParse(await readBody(event))
  if (!result.success) throw createError({ statusCode: 422, statusMessage: 'Invalid analytics event.' })
  analyticsBuffer.enqueue(result.data)
  setResponseStatus(event, 202)
  return { accepted: true }
})
