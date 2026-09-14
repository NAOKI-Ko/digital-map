import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { sanitizeOriginalFilename, validateImage } from '../server/utils/upload'

const mocks = vi.hoisted(() => ({ upsert: vi.fn(), getHeader: vi.fn(), getUserSession: vi.fn() }))
const testError = (input: { statusCode: number, statusMessage: string }) => Object.assign(new Error(input.statusMessage), input)

describe('WU-27 security hardening', () => {
  let consumeRateLimit: typeof import('../server/utils/rate-limit').consumeRateLimit
  let rateLimitKey: typeof import('../server/utils/rate-limit').rateLimitKey
  let enforceCsrfOrigin: typeof import('../server/utils/security').enforceCsrfOrigin
  let contentSecurityPolicy: typeof import('../server/utils/security').contentSecurityPolicy

  beforeAll(async () => {
    vi.stubGlobal('prisma', { rateLimitBucket: { upsert: mocks.upsert } })
    vi.stubGlobal('createError', testError)
    vi.stubGlobal('getMethod', () => 'POST')
    vi.stubGlobal('getRequestURL', () => new URL('https://admin.example.com/api/maps'))
    vi.stubGlobal('getUserSession', mocks.getUserSession)
    vi.stubGlobal('getHeader', mocks.getHeader)
    vi.stubGlobal('useRuntimeConfig', () => ({ trustedOrigins: 'https://admin.example.com', publicBaseUrl: 'https://public.example.com' }))
    ;({ consumeRateLimit, rateLimitKey } = await import('../server/utils/rate-limit'))
    ;({ enforceCsrfOrigin, contentSecurityPolicy } = await import('../server/utils/security'))
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserSession.mockResolvedValue({ user: { id: 'user-1' } })
    mocks.getHeader.mockReturnValue('https://admin.example.com')
  })
  afterAll(() => vi.unstubAllGlobals())

  it('stores an irreversible bucket key and enforces the configured boundary', async () => {
    const raw = 'User@Example.com\u001f203.0.113.2'
    expect(rateLimitKey('login', [raw], 900)).not.toContain(raw)
    mocks.upsert.mockResolvedValueOnce({ count: 5, windowEnd: new Date(Date.now() + 60_000) })
      .mockResolvedValueOnce({ count: 6, windowEnd: new Date(Date.now() + 60_000) })
    await expect(consumeRateLimit('login', [raw], { limit: 5, windowSeconds: 900 })).resolves.toMatchObject({ allowed: true, remaining: 0 })
    await expect(consumeRateLimit('login', [raw], { limit: 5, windowSeconds: 900 })).resolves.toMatchObject({ allowed: false, remaining: 0 })
  })

  it('accepts a trusted authenticated Origin and rejects missing/cross-site Origin', async () => {
    await expect(enforceCsrfOrigin({} as never)).resolves.toBeUndefined()
    mocks.getHeader.mockReturnValue('https://evil.example')
    await expect(enforceCsrfOrigin({} as never)).rejects.toMatchObject({ statusCode: 403 })
    mocks.getHeader.mockReturnValue(undefined)
    await expect(enforceCsrfOrigin({} as never)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('sanitizes names and rejects content whose signature does not match its MIME', () => {
    expect(sanitizeOriginalFilename('../../悪意\u0000.png')).toBe('__.png')
    expect(() => validateImage(Buffer.from('not png'), 'image/png', 'image.png')).toThrow()
    const tooLarge = Buffer.alloc(10 * 1024 * 1024 + 1)
    expect(() => validateImage(tooLarge, 'image/jpeg', 'image.jpg')).toThrow()
  })

  it('configures bounded secure cookies and the required response headers', () => {
    const config = readFileSync(new URL('../nuxt.config.ts', import.meta.url), 'utf8')
    const middleware = readFileSync(new URL('../server/middleware/01.security.ts', import.meta.url), 'utf8')
    expect(config).toContain('httpOnly: true')
    expect(config).toContain("sameSite: 'lax'")
    expect(config).toContain("secure: process.env.NODE_ENV === 'production'")
    for (const header of ['Content-Security-Policy', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy', 'Strict-Transport-Security']) expect(middleware).toContain(header)
    expect(middleware).not.toContain("default-src *")
  })

  it('allows MapLibre to fetch the configured OpenStreetMap tile host', () => {
    const connectSource = contentSecurityPolicy
      .split('; ')
      .find(directive => directive.startsWith('connect-src '))

    expect(connectSource?.split(' ')).toContain('https://tile.openstreetmap.org')
  })

  it('keeps Spot Editor payload strict and owner audit access isolated', () => {
    const schema = readFileSync(new URL('../shared/schemas/spot-revision.ts', import.meta.url), 'utf8')
    const audit = readFileSync(new URL('../server/api/organization/audit/index.get.ts', import.meta.url), 'utf8')
    expect(schema).toContain('.strict()')
    expect(schema).not.toContain('categoryIds')
    expect(audit).toContain('requireTenantOwner')
    expect(audit).toContain('tenantId: tenant.id')
  })
})
