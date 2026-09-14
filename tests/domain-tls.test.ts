import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { readFile } from 'node:fs/promises'
import { publicMapQrPayload } from '../server/utils/map-pdf'

describe('WU-39 fixed URL/domain/TLS readiness', () => {
  let validateProductionBaseUrl: typeof import('../server/utils/base-url').validateProductionBaseUrl
  let effectiveRequestProtocol: typeof import('../server/utils/base-url').effectiveRequestProtocol
  let effectiveRequestHost: typeof import('../server/utils/base-url').effectiveRequestHost
  const config = { publicBaseUrl: 'https://maps.example.test', adminBaseUrl: 'https://admin.example.test', trustedHosts: '', trustProxy: true }

  beforeAll(async () => {
    vi.stubGlobal('useRuntimeConfig', () => config)
    vi.stubGlobal('getHeader', (_event: unknown, name: string) => ({ 'x-forwarded-proto': 'https,http', 'x-forwarded-host': 'admin.example.test, proxy.internal' })[name])
    vi.stubGlobal('getRequestURL', () => new URL('http://127.0.0.1:3000/admin/login'))
    ;({ validateProductionBaseUrl, effectiveRequestProtocol, effectiveRequestHost } = await import('../server/utils/base-url'))
  })
  afterAll(() => vi.unstubAllGlobals())

  it('accepts only safe absolute HTTPS production base URLs', () => {
    expect(validateProductionBaseUrl('PUBLIC_BASE_URL', 'https://maps.example.jp/')).toBe('https://maps.example.jp')
    for (const invalid of ['http://maps.example.jp', 'https://localhost', 'https://127.0.0.1', 'https://random.trycloudflare.com', 'not-a-url']) {
      expect(() => validateProductionBaseUrl('PUBLIC_BASE_URL', invalid)).toThrow()
    }
  })

  it('uses trusted proxy protocol and host only when explicitly enabled', () => {
    expect(effectiveRequestProtocol({} as never)).toBe('https:')
    expect(effectiveRequestHost({} as never)).toBe('admin.example.test')
    config.trustProxy = false
    expect(effectiveRequestProtocol({} as never)).toBe('http:')
    expect(effectiveRequestHost({} as never)).toBe('127.0.0.1:3000')
    config.trustProxy = true
  })

  it('keeps QR/public metadata on PUBLIC_BASE_URL and account links on ADMIN_BASE_URL', async () => {
    expect(publicMapQrPayload('https://maps.example.test', 'central')).toBe('https://maps.example.test/central')
    const [publish, reset, invite, signup, publicPage] = await Promise.all([
      readFile('app/pages/admin/maps/[mapId]/publish.vue', 'utf8'), readFile('server/api/auth/password/reset-request.post.ts', 'utf8'), readFile('server/api/organization/invitations/index.post.ts', 'utf8'), readFile('server/api/signup/index.post.ts', 'utf8'), readFile('app/pages/[mapSlug]/index.vue', 'utf8'),
    ])
    expect(publish).toContain('configuredPublicOrigin')
    expect(reset).toContain('configuredAdminBaseUrl(event)')
    expect(invite).toContain('configuredAdminBaseUrl(event)')
    expect(signup).toContain('configuredAdminBaseUrl(event)')
    expect(publicPage).toContain('public.publicBaseUrl')
  })

  it('uses deployment environment—not optimized build mode—for QA-only raw links and fake-mail readiness', async () => {
    const sources = await Promise.all([
      readFile('server/api/ready.get.ts', 'utf8'),
      readFile('server/api/auth/password/reset-request.post.ts', 'utf8'),
      readFile('server/api/organization/invitations/index.post.ts', 'utf8'),
      readFile('server/api/signup/index.post.ts', 'utf8'),
    ])
    for (const source of sources) expect(source).toContain('deploymentEnvironment')
    expect(sources.join('\n')).not.toContain("process.env.NODE_ENV !== 'production'")
  })

  it('enforces trusted hosts, HTTPS redirect, Secure-cookie/HSTS policy in production source', async () => {
    const [middleware, plugin, configSource] = await Promise.all([readFile('server/middleware/01.security.ts', 'utf8'), readFile('server/plugins/00.production-config.ts', 'utf8'), readFile('nuxt.config.ts', 'utf8')])
    expect(middleware).toContain("config.deploymentEnvironment === 'production'")
    expect(middleware).toContain('configuredTrustedHosts(event)')
    expect(middleware).toContain('effectiveRequestProtocol(event)')
    expect(middleware).toContain('sendRedirect(event')
    expect(middleware).toContain("'Strict-Transport-Security'")
    expect(plugin).toContain("config.deploymentEnvironment !== 'production'")
    expect(configSource).toContain('process.env.DEPLOYMENT_ENV')
    expect(configSource).toContain("secure: process.env.NODE_ENV === 'production'")
  })

  it('ships credential-free named Tunnel instructions for separate public/admin hosts', async () => {
    const [example, docs] = await Promise.all([readFile('infra/cloudflared/config.example.yml', 'utf8'), readFile('docs/operations/domain-tls.md', 'utf8')])
    expect(example).toContain('maps.example.invalid')
    expect(example).toContain('admin.example.invalid')
    expect(example).not.toMatch(/token:\s*\S+/i)
    expect(docs).toContain('QA用Zone/hostnameと本番用Zone/hostnameを分離')
  })
})
