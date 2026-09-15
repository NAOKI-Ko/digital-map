import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireMapAccess: vi.fn(),
  readBody: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
}))

type Handler = (event: unknown) => Promise<unknown>
let handler: Handler

describe('WU-44 Map language API', () => {
  beforeAll(async () => {
    vi.stubGlobal('defineEventHandler', (value: Handler) => value)
    vi.stubGlobal('requireMapAccess', mocks.requireMapAccess)
    vi.stubGlobal('readBody', mocks.readBody)
    vi.stubGlobal('createError', (input: { statusCode: number, statusMessage: string }) => Object.assign(new Error(input.statusMessage), input))
    vi.stubGlobal('prisma', { map: { findFirst: mocks.findFirst, update: mocks.update } })
    handler = (await import('../server/api/maps/[mapId]/languages/index.patch')).default as Handler
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireMapAccess.mockResolvedValue({ map: { id: 'map-a' } })
    mocks.findFirst.mockResolvedValue({ defaultLocale: 'ja', enabledLocales: ['ja', 'en'] })
    mocks.update.mockResolvedValue({})
    mocks.readBody.mockResolvedValue({ enabledLocales: ['ja', 'en', 'zh-CN'] })
  })

  afterAll(() => vi.unstubAllGlobals())

  it('persists default-first stable ordering', async () => {
    await expect(handler({})).resolves.toEqual({ defaultLocale: 'ja', enabledLocales: ['ja', 'en', 'zh-CN'] })
    expect(mocks.update).toHaveBeenCalledWith({ where: { id: 'map-a' }, data: { enabledLocales: ['ja', 'en', 'zh-CN'] } })
  })

  it('rejects duplicate locale before writing', async () => {
    mocks.readBody.mockResolvedValue({ enabledLocales: ['ja', 'en', 'en'] })
    await expect(handler({})).rejects.toMatchObject({ statusCode: 422 })
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('blocks removal or demotion of the default locale', async () => {
    mocks.readBody.mockResolvedValue({ enabledLocales: ['en'] })
    await expect(handler({})).rejects.toMatchObject({ statusCode: 422, statusMessage: '既定言語は削除できません。' })
    mocks.readBody.mockResolvedValue({ enabledLocales: ['en', 'ja'] })
    await expect(handler({})).rejects.toMatchObject({ statusCode: 422, statusMessage: '既定言語は言語一覧の先頭にしてください。' })
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('inherits cross-Tenant and Spot Editor denial from the access guard', async () => {
    mocks.requireMapAccess.mockRejectedValue(Object.assign(new Error('not found'), { statusCode: 404 }))
    await expect(handler({})).rejects.toMatchObject({ statusCode: 404 })
    expect(mocks.findFirst).not.toHaveBeenCalled()
    expect(mocks.update).not.toHaveBeenCalled()
  })
})
