// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { useMapCamera } from '../app/composables/useMapCamera'
import { bindVisitorInitialViewportIntents, createVisitorInitialViewportLease } from '../app/utils/visitor-initial-viewport'
import { getFloorCorners, toImageCoordinates } from '../lib/geo'
import type { MapViewerCameraState, MapViewerFloor, MapViewerSpot } from '../shared/types/map-viewer'

const viewports = [[390,844], [430,932], [768,1024], [1024,768], [1440,900]] as const
const mercatorY = (lat: number) => .5 - Math.log((1 + Math.sin(lat * Math.PI / 180)) / (1 - Math.sin(lat * Math.PI / 180))) / (4 * Math.PI)
let callbacks = new Map<number, FrameRequestCallback>()
let nextFrameId = 0
beforeEach(() => {
  callbacks = new Map(); nextFrameId = 0
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => { callbacks.set(++nextFrameId, callback); return nextFrameId })
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(key => { callbacks.delete(key) })
})
const settle = () => { while (callbacks.size) { const batch = [...callbacks.values()]; callbacks.clear(); batch.forEach(callback => callback(0)) } }

function setup(initialCamera: MapViewerCameraState | null = null, initialSize: readonly [number, number] = [390,844]) {
  let width = initialSize[0], height = initialSize[1], zoom = 14, bearing = 0, pitch = 25, min = 0, max = 24
  let center: [number, number] = [0,0]
  const stage = document.createElement('div'); stage.className = 'public-map-stage'
  const frame = document.createElement('div'); stage.append(frame)
  Object.defineProperties(stage, { clientWidth: { get: () => width }, clientHeight: { get: () => height } })
  Object.defineProperties(frame, { clientWidth: { get: () => width - 2 }, clientHeight: { get: () => height - 2 } })
  frame.getBoundingClientRect = () => ({ left: 0, top: 0, width: width - 2, height: height - 2, right: width - 2, bottom: height - 2 } as DOMRect)
  const floor = ref({ id: 'f1', imageWidth: 1280, imageHeight: 800 } as MapViewerFloor)
  const ready = ref(true), blocked = ref(false)
  const instance = {
    stop: vi.fn(), resize: vi.fn(),
    getCenter: () => ({ lng: center[0], lat: center[1] }), getZoom: () => zoom,
    getBearing: () => bearing, getPitch: () => pitch, getMinZoom: () => min, getMaxZoom: () => max,
    setMinZoom: (value: number) => { min = value }, setMaxZoom: (value: number) => { max = value },
    cameraForBounds: vi.fn((bounds: [[number, number], [number, number]], options: { padding: { left: number, right: number, top: number, bottom: number }, maxZoom: number }) => {
      if (width <= 2 || height <= 2) return undefined
      return {
      center: [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2],
      zoom: Math.min(options.maxZoom,
        Math.log2((width - 2 - options.padding.left - options.padding.right) / (512 * ((bounds[1][0] - bounds[0][0]) / 360))),
        Math.log2((height - 2 - options.padding.top - options.padding.bottom) / (512 * (mercatorY(bounds[0][1]) - mercatorY(bounds[1][1]))))),
      }
    }),
    jumpTo: vi.fn((value: { center?: [number, number], zoom?: number, bearing?: number, pitch?: number }) => {
      center = value.center ?? center; zoom = value.zoom ?? zoom; bearing = value.bearing ?? bearing; pitch = value.pitch ?? pitch
    }),
    easeTo: vi.fn(),
    project: (point: [number, number]) => ({ x: width / 2 + (point[0] - center[0]) / 360 * 512 * 2 ** zoom,
      y: height / 2 + (mercatorY(point[1]) - mercatorY(center[1])) * 512 * 2 ** zoom * Math.cos(pitch * Math.PI / 180) }),
  }
  const map = ref(instance as unknown as MapLibreMap)
  const camera = useMapCamera(ref(frame), map, { mode: 'view', visitorOverview: ref(true), floor,
    spots: ref([{ id: 'a', x: .3, y: .35 }, { id: 'b', x: .7, y: .65 }] as MapViewerSpot[]),
    isReady: ref(true), initialViewportReady: ready, initialViewportBlocked: blocked, initialCamera })
  camera.fitFloorBounds(getFloorCorners(floor.value)!, false)
  if (initialCamera) camera.restore(initialCamera)
  const setSize = (w: number, h: number) => { width = w; height = h }
  return { camera, instance, map, floor, ready, blocked, stage, frame, settle, setSize,
    snapshot: () => ({ center: [...center], zoom, bearing, pitch, min, max }),
    corners: () => toImageCoordinates(getFloorCorners(floor.value)!).map(point => instance.project(point)) }
}

afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

describe('untouched initial viewport framing through the actual camera composable', () => {
  it.each(viewports.slice(0, 2))('keeps the initial mobile floor inside the frame at %ix%i without flattening it', (width, height) => {
    const h = setup(null, [width, height])
    for (const point of h.corners()) {
      expect(point.x).toBeGreaterThanOrEqual(24)
      expect(point.x).toBeLessThanOrEqual(width - 24)
      expect(point.y).toBeGreaterThanOrEqual(24)
      expect(point.y).toBeLessThanOrEqual(height - 24)
    }
    expect(h.snapshot().pitch).toBe(25)
    expect(h.camera.getHomePitch()).toBe(25)
    expect(h.instance.easeTo).not.toHaveBeenCalled()
  })

  it('recovers an uncomputable cold zero-size fit only after loaded positive layout, then deduplicates it', () => {
    const h = setup(null, [0,0])
    h.instance.cameraForBounds.mockClear(); h.instance.jumpTo.mockClear()
    h.ready.value = false; h.setSize(390,844); h.camera.resize(); h.settle()
    expect(h.instance.cameraForBounds).not.toHaveBeenCalled()
    expect(h.instance.jumpTo).not.toHaveBeenCalled()
    h.ready.value = true; h.camera.resize(); h.settle()
    expect(h.instance.cameraForBounds).toHaveBeenCalledTimes(2)
    const fresh = setup()
    expect(h.snapshot()).toEqual(fresh.snapshot())
    h.camera.resize(); h.settle()
    expect(h.instance.cameraForBounds).toHaveBeenCalledTimes(2)
  })

  it('all five sequential layouts produce the same framing as fresh initialization, repeatedly, without animation', () => {
    const sequential = setup()
    for (const [width, height] of viewports) {
      sequential.setSize(width, height); sequential.camera.resize(); sequential.settle()
      const fresh = setup(); fresh.setSize(width, height)
      fresh.camera.fitFloorBounds(getFloorCorners(fresh.floor.value)!, false)
      expect(sequential.snapshot()).toEqual(fresh.snapshot())
      const expected = fresh.corners()
      sequential.corners().forEach((point, index) => {
        expect(Math.abs(point.x - expected[index]!.x)).toBeLessThan(1)
        expect(Math.abs(point.y - expected[index]!.y)).toBeLessThan(1)
      })
      const state = sequential.snapshot()
      expect(state.bearing).toBe(0); expect(state.pitch).toBe(25); expect(sequential.camera.getHomePitch()).toBe(25)
      expect(state.min).toBeGreaterThanOrEqual(0); expect(state.zoom).toBeGreaterThanOrEqual(state.min)
      expect(state.zoom).toBeLessThanOrEqual(state.max); expect(state.max).toBeLessThanOrEqual(24)
      const count = sequential.instance.cameraForBounds.mock.calls.length
      sequential.camera.resize(); sequential.settle()
      expect(sequential.instance.cameraForBounds).toHaveBeenCalledTimes(count)
    }
    expect(sequential.instance.easeTo).not.toHaveBeenCalled()
  })

  it('coalesces a resize burst to the latest frame, then never refits after manual exploration', () => {
    const h = setup(); h.instance.cameraForBounds.mockClear()
    for (const [width, height] of viewports.slice(1)) { h.setSize(width, height); h.camera.resize() }
    h.settle()
    expect(h.instance.cameraForBounds).toHaveBeenCalledTimes(2) // whole-floor constraints + full content
    h.camera.releaseInitialViewport()
    h.instance.jumpTo({ center: [.001, -.001], zoom: 18, bearing: 70, pitch: 45 })
    const explored = h.snapshot()
    for (const [width, height] of viewports) { h.setSize(width, height); h.camera.resize(); h.settle() }
    expect(h.snapshot()).toMatchObject({ center: explored.center, zoom: explored.zoom, bearing: 70, pitch: 45 })
  })

  it.each(['intent', 'blocked', 'loading', 'zero', 'geometry', 'disposed'] as const)('rejects a pending fit when %s intervenes', reason => {
    const h = setup(); h.setSize(1440,900); h.camera.resize(); h.instance.jumpTo.mockClear()
    if (reason === 'intent') h.camera.releaseInitialViewport()
    if (reason === 'blocked') h.blocked.value = true
    if (reason === 'loading') h.ready.value = false
    if (reason === 'zero') h.setSize(0,0)
    if (reason === 'geometry') h.floor.value = { ...h.floor.value, id: 'f2' }
    if (reason === 'disposed') h.map.value = null as unknown as MapLibreMap
    h.settle()
    expect(h.instance.jumpTo).not.toHaveBeenCalled()
  })

  it('saved camera and Whole handoff remain passive and cannot rearm on clearing state or another floor fit', () => {
    const saved = setup({ center: { lng: .001, lat: -.001 }, zoom: 18 })
    saved.setSize(1440,900); saved.camera.resize(); saved.settle()
    expect(saved.snapshot()).toMatchObject({ center: [.001, -.001], zoom: 18 })
    const h = setup(); h.camera.showWholeFloor()
    expect(h.camera.getHomePitch()).toBe(0)
    h.camera.fitFloorBounds(getFloorCorners(h.floor.value)!, false)
    h.instance.jumpTo.mockClear(); h.setSize(1440,900); h.camera.resize(); h.settle()
    // Passive hard bounds can clamp, but cannot reset heading or content centre.
    expect(h.instance.jumpTo.mock.calls.every(([value]) => value.pitch === undefined && value.bearing === undefined)).toBe(true)
    expect(h.camera.getHomePitch()).toBe(25) // normal explicit floor-fit semantics
  })
})

describe('camera intent capture before shell and marker state updates', () => {
  it.each(['category-click', 'canvas-key', 'marker-focus', 'control-key', 'wheel'] as const)('cancels %s even without MapLibre originalEvent; closing never rearms', action => {
    const root = document.createElement('div'), button = document.createElement('button'), canvas = document.createElement('canvas')
    canvas.className = 'maplibregl-canvas'; button.className = 'map-viewer-marker'; root.append(button, canvas)
    const lease = createVisitorInitialViewportLease(true); lease.noteInitialFit('390')
    const token = lease.request('1440', true)!
    const detach = bindVisitorInitialViewportIntents(root, lease.release)
    if (action === 'category-click') button.click()
    if (action === 'canvas-key') canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
    if (action === 'marker-focus') button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    if (action === 'control-key') button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    if (action === 'wheel') canvas.dispatchEvent(new WheelEvent('wheel', { bubbles: true }))
    expect(lease.canCommit(token, '1440', true)).toBe(false)
    lease.noteInitialFit('390'); expect(lease.request('1440', true)).toBeNull()
    detach()
  })

  it('hover and internal camera events retain the lease; disposing listeners stops capture', () => {
    const root = document.createElement('div'), release = vi.fn()
    const detach = bindVisitorInitialViewportIntents(root, release)
    for (const name of ['pointermove', 'mouseover', 'movestart', 'resize']) root.dispatchEvent(new Event(name, { bubbles: true }))
    expect(release).not.toHaveBeenCalled()
    detach(); root.click(); expect(release).not.toHaveBeenCalled()
  })
})
