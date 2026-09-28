import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { visitorPreviewPath, visitorPreviewReturnPath } from '../shared/utils/visitor-preview'

const mocks = vi.hoisted(() => ({
  requireMapAccess: vi.fn(),
  getLivePublicMapById: vi.fn(),
  setResponseHeaders: vi.fn(),
}))

vi.mock('../server/utils/public-map', () => ({
  getLivePublicMapById: mocks.getLivePublicMapById,
}))

type Handler = (event: unknown) => Promise<any>
let handler: Handler

describe('authenticated whole-map visitor preview', () => {
  beforeAll(async () => {
    vi.stubGlobal('defineEventHandler', (value: Handler) => value)
    vi.stubGlobal('requireMapAccess', mocks.requireMapAccess)
    vi.stubGlobal('getQuery', () => ({ lang: 'ja' }))
    vi.stubGlobal('setResponseHeaders', mocks.setResponseHeaders)
    vi.stubGlobal('createError', (input: { statusCode: number, statusMessage: string }) => Object.assign(new Error(input.statusMessage), input))
    handler = (await import('../server/api/maps/[mapId]/visitor-preview.get')).default as Handler
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireMapAccess.mockResolvedValue({ map: { id: 'authorized-map' } })
    mocks.getLivePublicMapById.mockResolvedValue({ id: 'authorized-map', name: 'LIVE title', floors: [], slug: 'map' })
  })
  afterAll(() => vi.unstubAllGlobals())

  it('authorized editor gets the visitor DTO from LIVE even without a release', async () => {
    const event = {}
    const result = await handler(event)
    expect(result.map).toMatchObject({ name: 'LIVE title', floors: [] })
    expect(mocks.getLivePublicMapById).toHaveBeenCalledWith('authorized-map', 'ja')
    expect(mocks.setResponseHeaders).toHaveBeenCalledWith(event, expect.objectContaining({
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
    }))
  })

  it.each(['anonymous', 'unrelated user'])('%s is stopped before LIVE is read', async () => {
    mocks.requireMapAccess.mockRejectedValueOnce(Object.assign(new Error('denied'), { statusCode: 404 }))
    await expect(handler({})).rejects.toMatchObject({ statusCode: 404 })
    expect(mocks.getLivePublicMapById).not.toHaveBeenCalled()
  })

  it('never selects a retained release instead of LIVE', async () => {
    mocks.getLivePublicMapById.mockResolvedValueOnce({ name: 'LIVE B', floors: [], slug: 'map' })
    const result = await handler({})
    expect(result.map.name).toBe('LIVE B')
    expect(mocks.getLivePublicMapById).toHaveBeenCalledOnce()
  })
})

describe('preview return context', () => {
  it('accepts only the enumerated Publish return target', () => {
    expect(visitorPreviewPath('map-a', 'publish')).toBe('/admin/maps/map-a/preview?from=publish')
    expect(visitorPreviewReturnPath('map-a', 'publish')).toBe('/admin/maps/map-a/publish')
    expect(visitorPreviewReturnPath('map-a', 'home')).toBe('/admin/maps/map-a')
    expect(visitorPreviewReturnPath('map-a', 'https://evil.example')).toBe('/admin/maps/map-a')
    expect(visitorPreviewReturnPath('map-a', '//evil.example')).toBe('/admin/maps/map-a')
    expect(visitorPreviewReturnPath('map-a', ['publish'])).toBe('/admin/maps/map-a')
  })
})
