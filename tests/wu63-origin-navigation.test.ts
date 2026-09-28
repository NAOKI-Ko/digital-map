import { describe, expect, it } from 'vitest'
import { adminAbsoluteUrl, assertDeploymentOrigins, canonicalOrigin } from '../shared/utils/origin'
import { buildPublicMapUrl } from '../shared/utils/public-url'
import { publicMapQrPayload } from '../server/utils/map-pdf'
import { resolveNavigationMap } from '../app/utils/admin-navigation'

describe('WU-63 canonical origins', () => {
  const admin = 'https://admin.example.jp'
  const publicMap = 'https://maps.example.jp'

  it('keeps staff links on Admin origin and Map/QR links on Public origin', () => {
    expect(adminAbsoluteUrl(admin, '/signup/verify?token=example')).toBe(`${admin}/signup/verify?token=example`)
    expect(adminAbsoluteUrl(admin, '/invite/accept?token=example')).toBe(`${admin}/invite/accept?token=example`)
    expect(adminAbsoluteUrl(admin, '/reset-password?token=example')).toBe(`${admin}/reset-password?token=example`)
    expect(buildPublicMapUrl(publicMap, 'aquarium')).toBe(`${publicMap}/aquarium`)
    expect(publicMapQrPayload(publicMap, 'aquarium')).toBe(`${publicMap}/aquarium`)
  })

  it('rejects malformed origins and unsafe paths', () => {
    expect(() => canonicalOrigin('', 'PUBLIC_ORIGIN')).toThrow('required')
    expect(() => canonicalOrigin('https://maps.example.jp/old-host', 'PUBLIC_ORIGIN')).toThrow('without credentials')
    expect(() => adminAbsoluteUrl(admin, '//evil.example')).toThrow('root-relative')
  })

  it('allows localhost development but requires explicit matching QA/production origins', () => {
    expect(() => assertDeploymentOrigins('development', { adminOrigin: 'http://localhost:3000', publicOrigin: 'http://localhost:3000' }, {})).not.toThrow()
    expect(() => assertDeploymentOrigins('qa', { adminOrigin: admin, publicOrigin: publicMap }, { adminOrigin: admin, publicOrigin: publicMap })).not.toThrow()
    expect(() => assertDeploymentOrigins('qa', { adminOrigin: admin, publicOrigin: publicMap }, { adminOrigin: admin, publicOrigin: 'https://old.example.jp' })).toThrow('differs')
    expect(() => assertDeploymentOrigins('production', { adminOrigin: admin, publicOrigin: publicMap }, { publicOrigin: publicMap })).toThrow('ADMIN_BASE_URL is required')
  })
})

describe('WU-63 URL-authoritative Map context', () => {
  const maps = [{ id: 'first', name: 'First' }, { id: 'created', name: 'Created' }]
  it('uses the route Map after the authorized list refreshes', () => {
    expect(resolveNavigationMap(maps, 'created')).toEqual(maps[1])
    expect(resolveNavigationMap(maps, 'unknown')).toBeNull()
    expect(resolveNavigationMap([maps[0]!], null)).toEqual(maps[0])
  })
})
