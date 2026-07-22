import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  update: vi.fn(),
}))

vi.mock('../server/utils/prisma', () => ({
  prisma: { map: { findFirst: mocks.findFirst, update: mocks.update } },
}))

import { setOwnedMapPublication } from '../server/utils/map-publication'

describe('マップの公開状態更新', () => {
  beforeEach(() => {
    mocks.findFirst.mockReset()
    mocks.update.mockReset()
  })

  it('同じテナントが所有するマップだけを公開する', async () => {
    mocks.findFirst.mockResolvedValue({ id: 'map-1' })
    mocks.update.mockResolvedValue({ id: 'map-1', isPublished: true })

    await expect(setOwnedMapPublication('map-1', 'tenant-1', true)).resolves.toEqual({
      id: 'map-1',
      isPublished: true,
    })
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: { id: 'map-1', tenantId: 'tenant-1' },
      select: { id: true },
    })
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'map-1' },
      data: { isPublished: true },
    }))
  })

  it('所有していないマップは更新しない', async () => {
    mocks.findFirst.mockResolvedValue(null)

    await expect(setOwnedMapPublication('map-2', 'tenant-1', false)).resolves.toBeNull()
    expect(mocks.update).not.toHaveBeenCalled()
  })
})
