import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireOwnedSpot: vi.fn(),
  readBody: vi.fn(),
  update: vi.fn(),
}))

// The route keeps its legacy wire contract; PostgreSQL adapter coverage is in WU72 integration tests.
vi.mock('../server/utils/spot-usage', () => ({ updateLegacySpot: (args: unknown) => mocks.update(args) }))

type Handler = (event: unknown) => Promise<unknown>
let handler: Handler
let removeHandler: Handler

function testError(input: { statusCode: number, statusMessage: string }) {
  return Object.assign(new Error(input.statusMessage), input)
}

describe('PATCH Spot IMAGE position', () => {
  beforeAll(async () => {
    vi.stubGlobal('defineEventHandler', (value: Handler) => value)
    vi.stubGlobal('requireOwnedSpot', mocks.requireOwnedSpot)
    vi.stubGlobal('readBody', mocks.readBody)
    vi.stubGlobal('createError', testError)
    vi.stubGlobal('prisma', { spot: { update: mocks.update }, illustrationPlacement: { count: vi.fn().mockResolvedValue(0) } })
    handler = (await import('../server/api/maps/[mapId]/spots/[spotId]/position.patch')).default as Handler
    removeHandler = (await import('../server/api/maps/[mapId]/spots/[spotId]/position.delete')).default as Handler
  })

  beforeEach(() => {
    mocks.requireOwnedSpot.mockReset().mockResolvedValue({ spot: { id: 'spot-1', liveVersion: 1, floorId: 'floor-1' } })
    mocks.readBody.mockReset()
    mocks.update.mockReset().mockResolvedValue({ liveVersion: 2 })
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
    mocks.readBody.mockResolvedValue({ x: 0.25, y: 0.75, expectedVersion: 1, expectedFloorId: 'floor-1', expectedFloorUpdatedAt: '2026-09-29T00:00:00.000Z' })
    await expect(handler({})).resolves.toEqual({ position: { x: 0.25, y: 0.75 }, liveVersion: 2 })
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 'spot-1', liveVersion: 1, floorId: 'floor-1', floor: { updatedAt: new Date('2026-09-29T00:00:00.000Z') } },
      select: { liveVersion: true },
      data: { x: 0.25, y: 0.75, liveVersion: { increment: 1 } },
    })
  })

  it('rejects a stale queue or a changed Floor before writing coordinates', async () => {
    for (const body of [{ x: 0.2, y: 0.3, expectedVersion: 0, expectedFloorId: 'floor-1', expectedFloorUpdatedAt: '2026-09-29T00:00:00.000Z' }, { x: 0.2, y: 0.3, expectedVersion: 1, expectedFloorId: 'other', expectedFloorUpdatedAt: '2026-09-29T00:00:00.000Z' }]) {
      mocks.readBody.mockResolvedValue(body)
      await expect(handler({})).rejects.toMatchObject({ statusCode: 409 })
    }
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('配置解除はSpotを削除せずx/yをnullにし、公開中なら下書きへ戻す', async () => {
    await expect(removeHandler({})).resolves.toEqual({ position: { x: null, y: null } })
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 'spot-1' },
      data: { x: null, y: null, isPublished: false, liveVersion: { increment: 1 } },
    })
  })
})
