import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { summarizeMediaUsage } from '../server/utils/media'

const mocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
  getRouterParam: vi.fn(),
  findFirst: vi.fn(),
  delete: vi.fn(),
}))

function testError(input: { statusCode: number, statusMessage: string, data?: unknown }) {
  return Object.assign(new Error(input.statusMessage), input)
}

const schemaSource = readFileSync(new URL('../prisma/schema.prisma', import.meta.url), 'utf8')

describe('Tenant Media Library', () => {
  let requireOwnedMediaAsset: typeof import('../server/utils/media').requireOwnedMediaAsset
  let deleteHandler: (event: unknown) => Promise<unknown>

  beforeAll(async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('requireAdminSession', mocks.requireAdminSession)
    vi.stubGlobal('getRouterParam', mocks.getRouterParam)
    vi.stubGlobal('createError', testError)
    vi.stubGlobal('getUploadDirectory', () => '/tmp/digital-map-media-test')
    vi.stubGlobal('prisma', {
      mediaAsset: {
        findFirst: mocks.findFirst,
        delete: mocks.delete,
      },
    })
    ;({ requireOwnedMediaAsset } = await import('../server/utils/media'))
    vi.stubGlobal('requireOwnedMediaAsset', requireOwnedMediaAsset)
    vi.stubGlobal('summarizeMediaUsage', summarizeMediaUsage)
    ;({ default: deleteHandler } = await import('../server/api/media/[assetId].delete'))
  })

  beforeEach(() => {
    mocks.requireAdminSession.mockReset().mockResolvedValue({ user: { tenantId: 'tenant-a' } })
    mocks.getRouterParam.mockReset().mockReturnValue('asset-a')
    mocks.findFirst.mockReset()
    mocks.delete.mockReset().mockResolvedValue({})
  })

  afterAll(() => vi.unstubAllGlobals())

  it('asset lookupをsession tenantIdで制約する', async () => {
    mocks.findFirst.mockResolvedValue({ id: 'asset-a', _count: emptyCounts(), storageKey: 'asset-a.png' })
    await requireOwnedMediaAsset({} as never)
    expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'asset-a', tenantId: 'tenant-a' },
    }))
  })

  it('別Tenantのassetは404として扱う', async () => {
    mocks.findFirst.mockResolvedValue(null)
    await expect(requireOwnedMediaAsset({} as never)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('複数consumerの参照数を合算する', () => {
    expect(summarizeMediaUsage({ ...emptyCounts(), mapLogos: 2, spotPhotos: 3 }).total).toBe(5)
    expect(schemaSource).toMatch(/mapLogos\s+Map\[\]/)
    expect(schemaSource).toMatch(/spotPhotos\s+SpotPhoto\[\]/)
  })

  it('使用中assetの削除を拒否してusage詳細を返す', async () => {
    mocks.findFirst.mockResolvedValue({
      id: 'asset-a',
      storageKey: 'asset-a.png',
      _count: { ...emptyCounts(), floorIllustrations: 1, spotPins: 2 },
    })
    await expect(deleteHandler({})).rejects.toMatchObject({
      statusCode: 409,
      data: { usage: expect.objectContaining({ total: 3 }) },
    })
    expect(mocks.delete).not.toHaveBeenCalled()
  })

  it('未使用assetは削除できる', async () => {
    mocks.findFirst.mockResolvedValue({ id: 'asset-a', storageKey: 'asset-a.png', _count: emptyCounts() })
    await expect(deleteHandler({})).resolves.toEqual({ deletedId: 'asset-a' })
    expect(mocks.delete).toHaveBeenCalledWith({ where: { id: 'asset-a' } })
  })
})

function emptyCounts() {
  return {
    mapLogos: 0,
    floorIllustrations: 0,
    categoryIcons: 0,
    spotPins: 0,
    spotPhotos: 0,
    decorations: 0,
  }
}
