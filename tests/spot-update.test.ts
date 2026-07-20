import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireOwnedSpot: vi.fn(),
  readBody: vi.fn(),
  floorFindFirst: vi.fn(),
  spotUpdate: vi.fn(),
}))

const baseBody = {
  floorId: 'floor-1',
  name: '公開スポット',
  category: '観光',
  description: '',
  hoursText: '',
  holidayText: '',
  phone: '',
  lat: 35,
  lng: 139,
}

type SpotUpdateHandler = (event: unknown) => Promise<unknown>
let handler: SpotUpdateHandler

function createTestError(input: { statusCode: number, statusMessage: string }) {
  return Object.assign(new Error(input.statusMessage), input)
}

describe('PATCH /api/maps/:mapId/spots/:spotId', () => {
  beforeAll(async () => {
    vi.stubGlobal('defineEventHandler', (value: SpotUpdateHandler) => value)
    vi.stubGlobal('requireOwnedSpot', mocks.requireOwnedSpot)
    vi.stubGlobal('readBody', mocks.readBody)
    vi.stubGlobal('createError', createTestError)
    vi.stubGlobal('prisma', {
      mapFloor: { findFirst: mocks.floorFindFirst },
      spot: { update: mocks.spotUpdate },
    })
    handler = (await import('../server/api/maps/[mapId]/spots/[spotId]/index.patch')).default as SpotUpdateHandler
  })

  beforeEach(() => {
    mocks.requireOwnedSpot.mockReset().mockResolvedValue({
      map: { id: 'map-1' },
      spot: {
        id: 'spot-1',
        floorId: 'floor-1',
        lat: 35,
        lng: 139,
        isPublished: true,
      },
    })
    mocks.readBody.mockReset()
    mocks.floorFindFirst.mockReset().mockResolvedValue({ id: 'floor-1' })
    mocks.spotUpdate.mockReset()
  })

  afterAll(() => vi.unstubAllGlobals())

  it('公開中スポットのlat/lngを両方nullにする更新を422で拒否する', async () => {
    mocks.readBody.mockResolvedValue({ ...baseBody, lat: null, lng: null })

    await expect(handler({})).rejects.toMatchObject({
      statusCode: 422,
      statusMessage: '公開中のスポットから位置を削除できません。先に下書きへ戻してください。',
      message: '公開中のスポットから位置を削除できません。先に下書きへ戻してください。',
    })
    expect(mocks.spotUpdate).not.toHaveBeenCalled()
  })

  it.each([
    { label: 'latのみnull', lat: null, lng: 139 },
    { label: 'lngのみnull', lat: 35, lng: null },
  ])('公開中スポットの$labelにする更新を422で拒否する', async ({ lat, lng }) => {
    mocks.readBody.mockResolvedValue({ ...baseBody, lat, lng })

    await expect(handler({})).rejects.toMatchObject({
      statusCode: 422,
      statusMessage: '緯度と経度は両方入力するか、両方空欄にしてください。',
      message: '緯度と経度は両方入力するか、両方空欄にしてください。',
    })
    expect(mocks.floorFindFirst).not.toHaveBeenCalled()
    expect(mocks.spotUpdate).not.toHaveBeenCalled()
  })
})
