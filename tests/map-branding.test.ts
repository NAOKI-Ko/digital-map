import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { mapBrandingSchema } from '../shared/schemas/map'

const mocks = vi.hoisted(() => ({
  requireOwnedMap: vi.fn(),
  readValidatedBody: vi.fn(),
  update: vi.fn(),
}))

type BrandingHandler = (event: unknown) => Promise<unknown>
let handler: BrandingHandler

describe('限定的な団体branding', () => {
  beforeAll(async () => {
    vi.stubGlobal('defineEventHandler', (value: BrandingHandler) => value)
    vi.stubGlobal('requireOwnedMap', mocks.requireOwnedMap)
    vi.stubGlobal('readValidatedBody', mocks.readValidatedBody)
    vi.stubGlobal('prisma', { map: { update: mocks.update } })
    handler = (await import('../server/api/maps/[mapId]/branding.patch')).default as BrandingHandler
  })

  beforeEach(() => {
    mocks.requireOwnedMap.mockReset().mockResolvedValue({ map: { id: 'owned-map' }, session: { user: { tenantId: 'tenant-a' } } })
    mocks.readValidatedBody.mockReset().mockImplementation(async (_event, parse) => parse({
      organizationName: 'まちづくり協会',
      logoUrl: '/uploads/logo.png',
      websiteUrl: 'https://example.jp',
      snsUrl: 'https://social.example.jp/account',
    }))
    mocks.update.mockReset().mockResolvedValue({
      organizationName: 'まちづくり協会',
      logoUrl: '/uploads/logo.png',
      websiteUrl: 'https://example.jp',
      snsUrl: 'https://social.example.jp/account',
    })
  })

  afterAll(() => vi.unstubAllGlobals())

  it('空欄をnullとして許可し、任意設定を維持する', () => {
    expect(mapBrandingSchema.parse({ organizationName: '', logoUrl: '', websiteUrl: '', snsUrl: '' })).toEqual({
      organizationName: null,
      logoUrl: null,
      websiteUrl: null,
      snsUrl: null,
    })
  })

  it('外部logoやhttp/https以外のリンクを拒否する', () => {
    expect(mapBrandingSchema.safeParse({ organizationName: '', logoUrl: 'https://example.jp/logo.png', websiteUrl: '', snsUrl: '' }).success).toBe(false)
    expect(mapBrandingSchema.safeParse({ organizationName: '', logoUrl: '', websiteUrl: 'javascript:alert(1)', snsUrl: '' }).success).toBe(false)
  })

  it('ownership確認済みMap IDだけを更新する', async () => {
    await expect(handler({})).resolves.toEqual({ branding: expect.objectContaining({ organizationName: 'まちづくり協会' }) })
    expect(mocks.requireOwnedMap).toHaveBeenCalled()
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'owned-map' } }))
  })
})
