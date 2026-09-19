import { describe, expect, it, vi } from 'vitest'
import type { Map as MapLibreMap } from 'maplibre-gl'
import {
  applyPassiveCameraResize,
  createOneShotLocationCameraPolicy,
} from '../app/composables/useMapCamera'

function createCameraMap(zoom: number) {
  return {
    getCenter: vi.fn(() => ({ lat: 35.1, lng: 139.2 })),
    getZoom: vi.fn(() => zoom),
    resize: vi.fn(),
    jumpTo: vi.fn(),
    easeTo: vi.fn(),
    fitBounds: vi.fn(),
  } as unknown as MapLibreMap
}

describe('passive Map resize camera policy', () => {
  it('same-orientation browser chrome resize preserves camera without recalculating constraints', () => {
    const instance = createCameraMap(16.5)
    const recalculate = vi.fn(() => ({ minZoom: 15, maxZoom: 22 }))

    const result = applyPassiveCameraResize(instance, '390:portrait:844', '390:portrait:844', recalculate)

    expect(instance.resize).toHaveBeenCalledOnce()
    expect(recalculate).not.toHaveBeenCalled()
    expect(instance.jumpTo).not.toHaveBeenCalled()
    expect(instance.easeTo).not.toHaveBeenCalled()
    expect(instance.fitBounds).not.toHaveBeenCalled()
    expect(result).toEqual({ layoutKey: '390:portrait:844', constraintsChanged: false, clamped: false })
  })

  it('actual viewport change preserves a valid center and zoom without a refit', () => {
    const instance = createCameraMap(16.5)
    const recalculate = vi.fn(() => ({ minZoom: 15, maxZoom: 22 }))

    const result = applyPassiveCameraResize(instance, '390:portrait:844', '844:landscape:390', recalculate)

    expect(recalculate).toHaveBeenCalledOnce()
    expect(instance.jumpTo).not.toHaveBeenCalled()
    expect(instance.easeTo).not.toHaveBeenCalled()
    expect(instance.fitBounds).not.toHaveBeenCalled()
    expect(result).toEqual({ layoutKey: '844:landscape:390', constraintsChanged: true, clamped: false })
  })

  it('actual hard-bound change clamps zoom only and preserves the prior center', () => {
    const instance = createCameraMap(14)
    const recalculate = vi.fn(() => ({ minZoom: 15, maxZoom: 22 }))

    const result = applyPassiveCameraResize(instance, '390:portrait:844', '844:landscape:390', recalculate)

    expect(instance.jumpTo).toHaveBeenCalledOnce()
    expect(instance.jumpTo).toHaveBeenCalledWith({ center: [139.2, 35.1], zoom: 15 })
    expect(instance.easeTo).not.toHaveBeenCalled()
    expect(instance.fitBounds).not.toHaveBeenCalled()
    expect(result.clamped).toBe(true)
  })
})

describe('explicit current-location camera policy', () => {
  it('restores at most once per explicit request and never pulls camera back on watcher updates', () => {
    let camera = { center: { lat: 35.1, lng: 139.2 }, zoom: 16 }
    const restore = vi.fn()
    const policy = createOneShotLocationCameraPolicy(() => camera, restore)

    policy.beginRequest()
    policy.consumeOutsideResult(true)
    expect(restore).toHaveBeenCalledTimes(1)
    expect(restore).toHaveBeenLastCalledWith({ center: { lat: 35.1, lng: 139.2 }, zoom: 16 })

    camera = { center: { lat: 35.5, lng: 139.8 }, zoom: 18 }
    policy.consumeOutsideResult(false)
    expect(restore).toHaveBeenCalledTimes(1)

    policy.beginRequest()
    policy.consumeOutsideResult(true)
    expect(restore).toHaveBeenCalledTimes(2)
    expect(restore).toHaveBeenLastCalledWith({ center: { lat: 35.5, lng: 139.8 }, zoom: 18 })
  })
})
