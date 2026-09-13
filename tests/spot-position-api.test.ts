import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireOwnedSpot: vi.fn(),
  readBody: vi.fn(),
  update: vi.fn(),
}))

type Handler = (event: unknown) => Promise<unknown>
let handler: Handler

function testError(input: { statusCode: number, statusMessage: string }) {
  return Object.assign(new Error(input.statusMessage), input)
}

describe('PATCH Spot IMAGE position', () => {
  beforeAll(async () => {
    vi.stubGlobal('defineEventHandler', (value: Handler) => value)
    vi.stubGlobal('requireOwnedSpot', mocks.requireOwnedSpot)
    vi.stubGlobal('readBody', mocks.readBody)
    vi.stubGlobal('createError', testError)
    vi.stubGlobal('prisma', { spot: { update: mocks.update } })
    handler = (await import('../server/api/maps/[mapId]/spots/[spotId]/position.patch')).default as Handler
  })

  beforeEach(() => {
    mocks.requireOwnedSpot.mockReset().mockResolvedValue({ spot: { id: 'spot-1' } })
    mocks.readBody.mockReset()
    mocks.update.mockReset()
  })

  afterAll(() => vi.unstubAllGlobals())

  it.each([
    { x: -0.001, y: 0.5 },
    { x: 1.001, y: 0.5 },
    { x: 0.5, y: -0.001 },
    { x: 0.5, y: 1.001 },
    { x: 0.5 },
    { y: 0.5 },
  ])('partial/out-of-range direct writeを拒否する: %j', async (body) => {
    mocks.readBody.mockResolvedValue(body)
    await expect(handler({})).rejects.toMatchObject({ statusCode: 422 })
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('bounded x/yだけを永続化する', async () => {
    mocks.readBody.mockResolvedValue({ x: 0.25, y: 0.75 })
    await expect(handler({})).resolves.toEqual({ position: { x: 0.25, y: 0.75 } })
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 'spot-1' },
      data: { x: 0.25, y: 0.75 },
    })
  })
})
