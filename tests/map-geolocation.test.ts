import { describe, expect, it } from 'vitest'
import {
  beginGeolocationRequest,
  consumeOutsideGeolocation,
  GEOLOCATION_OUTSIDE_MESSAGE,
  GEOLOCATION_TOAST_DURATION_MS,
} from '../app/composables/useMapGeolocation'

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
})
