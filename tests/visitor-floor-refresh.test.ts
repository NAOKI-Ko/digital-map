import { nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { watchViewerFloorRendering } from '../app/composables/watchViewerFloorRendering'
import type { MapViewerFloor } from '../shared/types/map-viewer'

const initial: MapViewerFloor = {
  id: 'floor-1', name: '1F', illustrationUrl: '/floor.png', imageWidth: 1000, imageHeight: 500,
  refAImageX: 0, refAImageY: 0, refALat: 35.7, refALng: 139.7,
  refBImageX: 1, refBImageY: 0, refBLat: 35.7, refBLng: 139.71,
}

describe('retained visitor floor refresh', () => {
  it('leaves the explored camera and resources unchanged for a translated response', async () => {
    const floor = ref({ ...initial })
    const refresh = vi.fn()
    const stop = watchViewerFloorRendering(floor, () => true, refresh)
    floor.value = { ...initial, name: 'First floor' }
    await nextTick()
    expect(refresh).not.toHaveBeenCalled()
    stop()
  })

  it('replaces a refreshed illustration without refitting the camera', async () => {
    const floor = ref({ ...initial })
    const refresh = vi.fn()
    const stop = watchViewerFloorRendering(floor, () => true, refresh)
    floor.value = { ...initial, illustrationUrl: '/new-release/floor.png' }
    await nextTick()
    expect(refresh).toHaveBeenCalledExactlyOnceWith(floor.value, false)
    stop()
  })

  it.each(['imageWidth', 'refALng', 'refBImageY'] as const)('resynchronizes coordinates and controls after %s changes on the same floor ID', async field => {
    const floor = ref({ ...initial })
    const refresh = vi.fn()
    const stop = watchViewerFloorRendering(floor, () => true, refresh)
    floor.value[field] = initial[field]! + 0.1
    await nextTick()
    expect(refresh).toHaveBeenCalledExactlyOnceWith(floor.value, true)
    stop()
  })

  it('resynchronizes geolocation availability when references are removed', async () => {
    const floor = ref<MapViewerFloor>({ ...initial })
    const refresh = vi.fn()
    const stop = watchViewerFloorRendering(floor, () => true, refresh)
    floor.value = { ...initial, refALat: null }
    await nextTick()
    expect(refresh).toHaveBeenCalledExactlyOnceWith(floor.value, true)
    stop()
  })

  it('retains existing editor behavior: resources refresh only on an explicit floor switch', async () => {
    const floor = ref({ ...initial })
    const refresh = vi.fn()
    const stop = watchViewerFloorRendering(floor, () => false, refresh)
    floor.value = { ...initial, illustrationUrl: '/changed.png', refALng: 140 }
    await nextTick()
    expect(refresh).not.toHaveBeenCalled()
    floor.value.id = 'floor-2'
    await nextTick()
    expect(refresh).toHaveBeenCalledExactlyOnceWith(floor.value, true)
    stop()
  })
})
