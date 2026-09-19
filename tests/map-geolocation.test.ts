// @vitest-environment happy-dom
import { ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  beginGeolocationRequest,
  consumeOutsideGeolocation,
  GEOLOCATION_OUTSIDE_MESSAGE,
  GEOLOCATION_TOAST_DURATION_MS,
  useMapGeolocation,
} from '../app/composables/useMapGeolocation'

afterEach(() => vi.useRealTimers())

describe('explicit geolocation request lifecycle', () => {
  it('consumes one outside notice for a continuing GPS watcher request', () => {
    let state = beginGeolocationRequest({ requestId: 0, notifiedRequestId: null })

    const first = consumeOutsideGeolocation(state)
    expect(first).toMatchObject({ notify: true, requestId: 1 })
    state = first.state

    const continuedWatcherUpdate = consumeOutsideGeolocation(state)
    expect(continuedWatcherUpdate).toMatchObject({ notify: false, requestId: 1 })
  })

  it('allows one new notice after a new explicit request', () => {
    let state = beginGeolocationRequest({ requestId: 0, notifiedRequestId: null })
    state = consumeOutsideGeolocation(state).state

    // Toast expiry does not create a request and therefore cannot re-arm the watcher.
    expect(consumeOutsideGeolocation(state).notify).toBe(false)

    state = beginGeolocationRequest(state)
    expect(consumeOutsideGeolocation(state)).toMatchObject({ notify: true, requestId: 2 })
  })

  it('keeps the accepted five-second outside-area message contract', () => {
    expect(GEOLOCATION_OUTSIDE_MESSAGE).toBe('現在地はこのマップから離れています')
    expect(GEOLOCATION_TOAST_DURATION_MS).toBe(5_000)
  })

  it('明示requestごとに一度だけtoastを出し、watcher更新で5秒timerを延長しない', () => {
    vi.useFakeTimers()
    let handler: ((position: any) => void) | null = null
    const button = document.createElement('button')
    button.className = 'maplibregl-ctrl-geolocate'
    const groupElement = document.createElement('div')
    groupElement.append(button)
    const control = {
      on: vi.fn((_event: string, callback: (position: any) => void) => { handler = callback }),
      off: vi.fn(),
    }
    class GeolocateControl { constructor() { return control } }
    class Marker {}
    const map = { addControl: vi.fn(), hasControl: vi.fn(() => true), removeControl: vi.fn() }
    const group = { getElement: () => groupElement }
    const geolocation = useMapGeolocation({
      mode: 'view',
      map: ref(map as any),
      maplibre: ref({ GeolocateControl, Marker } as any),
      createBaseControls: () => [],
      createControlGroup: () => group as any,
    })
    geolocation.syncControl({
      id: 'floor', name: 'Floor', illustrationUrl: '/uploads/floor.png',
      imageWidth: 100, imageHeight: 100,
      refAImageX: 0, refAImageY: 0, refALat: 35, refALng: 139,
      refBImageX: 100, refBImageY: 0, refBLat: 35, refBLng: 139.001,
    })
    button.click()
    handler!({ coords: { latitude: 0, longitude: 0 } })
    expect(geolocation.geolocationAreaMessage.value).toBe(GEOLOCATION_OUTSIDE_MESSAGE)
    vi.advanceTimersByTime(4_000)
    handler!({ coords: { latitude: 0, longitude: 0 } })
    vi.advanceTimersByTime(1_000)
    expect(geolocation.geolocationAreaMessage.value).toBe('')

    button.click()
    handler!({ coords: { latitude: 0, longitude: 0 } })
    expect(geolocation.geolocationAreaMessage.value).toBe(GEOLOCATION_OUTSIDE_MESSAGE)
    geolocation.removeControl()
  })
})
