import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { requestIdFor, resolveRequestId } from '../server/utils/request-context'

const mocks = vi.hoisted(() => ({ queryRaw: vi.fn(), setResponseStatus: vi.fn(), fetch: vi.fn() }))

describe('WU-28 observability', () => {
  let health: () => unknown
  let ready: (event: unknown) => Promise<unknown>
  let notifyOperations: typeof import('../server/utils/observability').notifyOperations
  let operationalLog: typeof import('../server/utils/observability').operationalLog
  let resetAlertDedupeForTest: typeof import('../server/utils/observability').resetAlertDedupeForTest

  beforeAll(async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('setResponseStatus', mocks.setResponseStatus)
    vi.stubGlobal('useRuntimeConfig', () => ({ deploymentEnvironment: 'production', resendApiKey: 'configured', mailFrom: 'mail@example.com', opsAlertWebhookUrl: 'https://ops.example/hook' }))
    vi.stubGlobal('prisma', { $queryRaw: mocks.queryRaw })
    vi.stubGlobal('fetch', mocks.fetch)
    ;({ notifyOperations, operationalLog, resetAlertDedupeForTest } = await import('../server/utils/observability'))
    ;({ default: health } = await import('../server/api/health.get'))
    ;({ default: ready } = await import('../server/api/ready.get'))
  })

  beforeEach(() => {
    vi.clearAllMocks()
    resetAlertDedupeForTest()
    mocks.queryRaw.mockResolvedValue([{ '?column?': 1 }])
    mocks.fetch.mockResolvedValue(new Response(null, { status: 204 }))
  })
  afterAll(() => vi.unstubAllGlobals())

  it('liveness has no database dependency and readiness verifies it', async () => {
    expect(health()).toEqual({ status: 'ok' })
    expect(mocks.queryRaw).not.toHaveBeenCalled()
    await expect(ready({})).resolves.toMatchObject({ status: 'ready', dependencies: { database: true } })
    mocks.queryRaw.mockRejectedValueOnce(new Error('offline'))
    await expect(ready({})).resolves.toMatchObject({ status: 'not_ready', dependencies: { database: false } })
    expect(mocks.setResponseStatus).toHaveBeenCalledWith({}, 503)
  })

  it('accepts only bounded safe request IDs and otherwise generates UUIDs', () => {
    expect(resolveRequestId('client-request_123')).toBe('client-request_123')
    expect(resolveRequestId('bad id')).toMatch(/^[0-9a-f-]{36}$/)
    expect(requestIdFor({ context: { requestId: 'request-1' } } as never)).toBe('request-1')
  })

  it('structured logs redact token-like values and sensitive keys', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    operationalLog('error', { code: 'failure', message: 'token=raw-secret password=hunter2', route: '/api/test' })
    const output = String(spy.mock.calls[0]?.[0])
    expect(output).toContain('token=[REDACTED]')
    expect(output).not.toContain('raw-secret')
    expect(output).not.toContain('hunter2')
    spy.mockRestore()
  })

  it('sanitizes and deduplicates repeated operations alerts', async () => {
    const first = await notifyOperations({ code: 'publish_failed', message: 'token=raw-secret', requestId: 'request-1', route: '/api/maps/x/publish' }, 1_000_000)
    const second = await notifyOperations({ code: 'publish_failed', message: 'another', route: '/api/maps/x/publish' }, 1_000_100)
    expect(first).toEqual({ sent: true })
    expect(second).toEqual({ sent: false, reason: 'deduplicated' })
    expect(mocks.fetch).toHaveBeenCalledTimes(1)
    expect(String(mocks.fetch.mock.calls[0]?.[1]?.body)).not.toContain('raw-secret')
  })
})
