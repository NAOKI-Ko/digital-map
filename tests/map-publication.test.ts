import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  update: vi.fn(),
  auditCreate: vi.fn(),
}))

vi.mock('../server/utils/prisma', () => ({
  prisma: {
    map: { findFirst: mocks.findFirst, update: mocks.update },
    $transaction: (callback: (client: unknown) => unknown) => callback({ map: { update: mocks.update }, auditEvent: { create: mocks.auditCreate } }),
  },
}))

import { setOwnedMapPublication } from '../server/utils/map-publication'
import { resolvePublicationToggleAction } from '../shared/utils/map-publication'

describe('マップの公開状態更新', () => {
  beforeEach(() => {
    mocks.findFirst.mockReset()
    mocks.update.mockReset()
    mocks.auditCreate.mockReset().mockResolvedValue({})
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

describe('公開スイッチの操作分岐', () => {
  it('公開中は非公開化する', () => {
    expect(resolvePublicationToggleAction(true, 'release-1')).toBe('unpublish')
  })

  it('公開停止中で現行版があれば安全に同じ版を再公開する', () => {
    expect(resolvePublicationToggleAction(false, 'release-1')).toBe('resume-current-release')
  })

  it('初回公開では最新内容から公開版を作る', () => {
    expect(resolvePublicationToggleAction(false, null)).toBe('publish-latest')
    expect(resolvePublicationToggleAction(false, undefined)).toBe('publish-latest')
  })
})
