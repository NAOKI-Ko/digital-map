import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmptyGeoReferenceDraft } from '../app/composables/useGeoReference'

const mocks = vi.hoisted(() => ({
  requireOwnedFloor: vi.fn(),
  update: vi.fn(),
  toMapFloorItem: vi.fn(value => value),
}))

const pageSource = readFileSync(new URL('../app/pages/admin/maps/[mapId]/floors/[floorId]/georeference.vue', import.meta.url), 'utf8')
const wizardSource = readFileSync(new URL('../app/components/admin/GeoReferenceWizard.vue', import.meta.url), 'utf8')

describe('ジオリファレンス調整と解除', () => {
  let removeHandler: (event: unknown) => Promise<unknown>

  beforeAll(async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('requireOwnedFloor', mocks.requireOwnedFloor)
    vi.stubGlobal('toMapFloorItem', mocks.toMapFloorItem)
    vi.stubGlobal('prisma', { mapFloor: { update: mocks.update } })
    ;({ default: removeHandler } = await import('../server/api/maps/[mapId]/floors/[floorId]/georeference.delete'))
  })

  beforeEach(() => {
    mocks.requireOwnedFloor.mockReset().mockResolvedValue({ floor: { id: 'floor-a' } })
    mocks.update.mockReset().mockResolvedValue({ id: 'floor-a', _count: { spots: 2 } })
  })

  afterAll(() => vi.unstubAllGlobals())

  it('解除はFloor基準点だけをnullにし、Spot位置を更新しない', async () => {
    await removeHandler({})
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'floor-a' },
      data: createEmptyGeoReferenceDraft(),
    }))
    expect(mocks.update.mock.calls[0]?.[0].data).not.toHaveProperty('x')
    expect(mocks.update.mock.calls[0]?.[0].data).not.toHaveProperty('y')
  })

  it('編集リセットと保存済み設定の解除を別操作として示す', () => {
    expect(pageSource).toContain('基準点をリセット')
    expect(pageSource.indexOf('基準点をリセット')).toBeLessThan(pageSource.indexOf('<AddressGeocoder'))
    expect(pageSource).toContain('保存済みの設定はまだ変更されていません')
    expect(pageSource).toContain('マップの位置合わせを解除')
    expect(pageSource).toContain('<ConfirmDialog')
  })

  it('Spotがある保存前にx/y不変の意味を明示する', () => {
    expect(pageSource).toContain('イラスト上のピン位置は変わりません。実世界との対応のみ更新されます。')
  })

  it('イラストのzoom/panとoverlay opacity調整を提供する', () => {
    expect(wizardSource).toContain('imageZoom')
    expect(wizardSource).toContain('overflow-auto')
    expect(wizardSource).toContain('previewOpacity')
    expect(wizardSource).toContain("setPaintProperty(PREVIEW_LAYER_ID, 'raster-opacity', value)")
  })
})
