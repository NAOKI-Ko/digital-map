import type { Ref } from 'vue'
import { canUseVisitorContentCamera, clampVisitorInitialZoom, getVisitorContentBounds, VISITOR_INITIAL_PITCH, VISITOR_INITIAL_ZOOM_ALLOWANCE, VISITOR_MOBILE_INITIAL_ZOOM_ALLOWANCE, VISITOR_INITIAL_FALLBACK_ZOOM_OFFSET, VISITOR_MOBILE_INITIAL_FALLBACK_ZOOM_OFFSET } from '~/utils/visitor-initial-camera'
import { measureVisitorFitPadding } from '~/utils/visitor-floor-fit'
import type { Map as MapLibreMap, MapOptions, StyleSpecification } from 'maplibre-gl'
import { getFloorCorners, getGeoReferenceBounds, toImageCoordinates, type FloorCorners } from '~~/lib/geo'
import type { MapViewerCameraState, MapViewerFloor, MapViewerSpot } from '~~/shared/types/map-viewer'
import { getViewportOrientation, isViewportCoveredByPolygon, type MapCenter } from '~/utils/public-map-camera'

export type MapViewerMode = 'view' | 'edit'

export const VIEWER_CAMERA_CONSTRAINTS = {
  view: {
    bearing: 0,
    pitch: 20,
    minPitch: 0,
    maxPitch: 70,
    dragRotate: true,
    touchPitch: true,
    pitchWithRotate: true,
  },
  edit: {
    bearing: 0,
    pitch: 0,
    minPitch: 0,
    maxPitch: 0,
    dragRotate: false,
    touchPitch: false,
    pitchWithRotate: false,
  },
} as const

export const ABSOLUTE_ZOOM_LIMITS = {
  minZoom: 0,
  maxZoom: 24,
} as const
export const ZOOM_OUT_ALLOWANCE = 0
export const PUBLIC_ZOOM_OUT_ALLOWANCE = 1
export const ZOOM_IN_ALLOWANCE = 6

export interface ZoomConstraints {
  minZoom: number
  maxZoom: number
}

export function createMapViewerStyle(_mode: MapViewerMode, visitor = false): StyleSpecification {
  return {
    version: 8,
    sources: {},
    layers: [{
      id: 'background',
      type: 'background',
      paint: { 'background-color': visitor ? '#f4f6f7' : '#f5f5f4' },
    }],
  }
}

export function createMapViewerOptions(container: HTMLElement | string, mode: MapViewerMode, visitor = false, locale: 'ja' | 'en' = 'ja'): MapOptions {
  const camera = VIEWER_CAMERA_CONSTRAINTS[mode]
  return {
    container,
    style: createMapViewerStyle(mode, visitor),
    center: [0, 0],
    zoom: 1,
    minZoom: ABSOLUTE_ZOOM_LIMITS.minZoom,
    maxZoom: ABSOLUTE_ZOOM_LIMITS.maxZoom,
    // Visitor double-tap/double-click zoom stays native; editing keeps placement gestures unambiguous.
    doubleClickZoom: mode === 'view' && visitor,
    locale: visitor && locale === 'ja' ? {
      'GeolocateControl.FindMyLocation': '現在地を表示',
      'GeolocateControl.LocationNotAvailable': '現在地を取得できません',
      'AttributionControl.ToggleAttribution': '地図のクレジットを表示',
    } : undefined,
    ...camera,
  }
}

export function createFloorZoomConstraints(fittedZoom: number): ZoomConstraints {
  const requestedZoom = Number.isFinite(fittedZoom) ? fittedZoom : 1
  const safeZoom = Math.min(
    ABSOLUTE_ZOOM_LIMITS.maxZoom,
    Math.max(ABSOLUTE_ZOOM_LIMITS.minZoom, requestedZoom),
  )
  return {
    minZoom: Math.max(ABSOLUTE_ZOOM_LIMITS.minZoom, safeZoom - ZOOM_OUT_ALLOWANCE),
    maxZoom: Math.min(ABSOLUTE_ZOOM_LIMITS.maxZoom, safeZoom + ZOOM_IN_ALLOWANCE),
  }
}

export function createPublicFloorZoomConstraints(fittedZoom: number, initialZoom: number): ZoomConstraints {
  const fit = Number.isFinite(fittedZoom) ? fittedZoom : 1
  const initial = Number.isFinite(initialZoom) ? initialZoom : fit
  const minZoom = Math.max(
    ABSOLUTE_ZOOM_LIMITS.minZoom,
    Math.min(ABSOLUTE_ZOOM_LIMITS.maxZoom, fit) - PUBLIC_ZOOM_OUT_ALLOWANCE,
  )
  const requestedMaxZoom = Math.min(
    ABSOLUTE_ZOOM_LIMITS.maxZoom,
    Math.max(ABSOLUTE_ZOOM_LIMITS.minZoom, initial) + ZOOM_IN_ALLOWANCE,
  )
  return {
    minZoom,
    maxZoom: Math.max(minZoom, requestedMaxZoom),
  }
}

export function getMapViewerCameraState(instance: MapLibreMap): MapViewerCameraState {
  const center = instance.getCenter()
  return {
    center: { lat: center.lat, lng: center.lng },
    zoom: instance.getZoom(),
  }
}

export function restoreMapViewerCamera(instance: MapLibreMap, camera: MapViewerCameraState) {
  instance.jumpTo({
    center: [camera.center.lng, camera.center.lat],
    zoom: camera.zoom,
  })
}

export function applyPassiveCameraResize(
  instance: MapLibreMap,
  previousLayoutKey: string,
  nextLayoutKey: string,
  recalculateConstraints: () => ZoomConstraints | null,
) {
  const camera = getMapViewerCameraState(instance)
  instance.resize()

  if (previousLayoutKey === nextLayoutKey) {
    return { layoutKey: nextLayoutKey, constraintsChanged: false, clamped: false }
  }

  const constraints = recalculateConstraints()
  if (!constraints) {
    return { layoutKey: nextLayoutKey, constraintsChanged: false, clamped: false }
  }

  const zoom = Math.min(constraints.maxZoom, Math.max(constraints.minZoom, camera.zoom))
  const clamped = zoom !== camera.zoom
  if (clamped) restoreMapViewerCamera(instance, { ...camera, zoom })

  return { layoutKey: nextLayoutKey, constraintsChanged: true, clamped }
}

export function createOneShotLocationCameraPolicy(
  getCamera: () => MapViewerCameraState,
  restoreCamera: (camera: MapViewerCameraState) => void,
) {
  let pendingCamera: MapViewerCameraState | null = null

  return {
    beginRequest() {
      pendingCamera = getCamera()
    },
    consumeOutsideResult(firstForRequest: boolean) {
      if (!firstForRequest || !pendingCamera) return false
      const camera = pendingCamera
      pendingCamera = null
      restoreCamera(camera)
      return true
    },
    reset() {
      pendingCamera = null
    },
  }
}

interface UseMapCameraOptions {
  mode: MapViewerMode
  floor: Readonly<Ref<MapViewerFloor>>
  visitorOverview?: Readonly<Ref<boolean>>
  spots?: Readonly<Ref<readonly MapViewerSpot[]>>
  mobileCover?: Readonly<Ref<boolean>>
  isReady: Readonly<Ref<boolean>>
}

export function useMapCamera(
  container: Readonly<Ref<HTMLElement | null>>,
  map: Readonly<Ref<MapLibreMap | null>>,
  options: UseMapCameraOptions,
) {
  let coverCameraKey = ''
  let coverZoom: number = ABSOLUTE_ZOOM_LIMITS.minZoom
  let largeViewportHeight = 0
  let largeViewportOrientation = ''
  let constraintLayoutKey = ''
  let homePitch: number = VIEWER_CAMERA_CONSTRAINTS[options.mode].pitch

  function usesMobileCover() {
    return options.mode === 'view'
      && (options.mobileCover?.value ?? false)
      && Boolean(container.value && container.value.clientWidth < 768)
  }

  function measureLargeViewportHeight() {
    if (typeof document === 'undefined') return container.value?.clientHeight ?? 0
    const probe = document.createElement('div')
    probe.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:100lvh;pointer-events:none;visibility:hidden'
    document.body.appendChild(probe)
    const height = probe.getBoundingClientRect().height
    probe.remove()
    return Math.max(height, container.value?.clientHeight ?? 0)
  }

  function getCoverViewport() {
    const width = container.value?.clientWidth ?? 0
    const height = container.value?.clientHeight ?? 0
    const orientation = getViewportOrientation(width, window.innerHeight)
    if (orientation !== largeViewportOrientation || largeViewportHeight <= 0) {
      largeViewportOrientation = orientation
      largeViewportHeight = measureLargeViewportHeight()
    }
    return { width, height, coverHeight: largeViewportHeight }
  }

  function getCoverLayoutKey() {
    const viewport = getCoverViewport()
    return `${Math.round(viewport.width)}:${getViewportOrientation(viewport.width, viewport.coverHeight)}:${Math.round(viewport.coverHeight)}`
  }

  function getConstraintLayoutKey() {
    if (usesMobileCover()) return getCoverLayoutKey()
    const width = container.value?.clientWidth ?? 0
    const height = container.value?.clientHeight ?? 0
    return `${Math.round(width)}:${getViewportOrientation(width, height)}:${Math.round(height)}`
  }

  function getFloorCenter(corners: FloorCorners): MapCenter {
    const bounds = getGeoReferenceBounds(corners)
    return {
      lat: (bounds.southwest[1] + bounds.northeast[1]) / 2,
      lng: (bounds.southwest[0] + bounds.northeast[0]) / 2,
    }
  }

  function isFloorCoveringViewport(corners: FloorCorners) {
    const instance = map.value
    if (!instance) return false
    const viewport = getCoverViewport()
    const polygon = toImageCoordinates(corners).map(coordinate => instance.project(coordinate))
    return isViewportCoveredByPolygon(polygon, viewport.width, viewport.height, viewport.coverHeight)
  }

  function jumpToCamera(center: MapCenter, zoom: number) {
    const instance = map.value
    if (!instance) return
    instance.jumpTo({ center: [center.lng, center.lat], zoom })
  }

  function findMobileCoverZoom(corners: FloorCorners, center: MapCenter, startZoom: number) {
    let low = Math.max(ABSOLUTE_ZOOM_LIMITS.minZoom, Math.min(ABSOLUTE_ZOOM_LIMITS.maxZoom, startZoom))
    let high = low
    jumpToCamera(center, high)
    while (!isFloorCoveringViewport(corners) && high < ABSOLUTE_ZOOM_LIMITS.maxZoom) {
      low = high
      high = Math.min(ABSOLUTE_ZOOM_LIMITS.maxZoom, high + 0.5)
      jumpToCamera(center, high)
    }
    for (let index = 0; index < 18 && high - low > 0.001; index += 1) {
      const candidate = (low + high) / 2
      jumpToCamera(center, candidate)
      if (isFloorCoveringViewport(corners)) high = candidate
      else low = candidate
    }
    jumpToCamera(center, high)
    return high
  }

  function getRequiredMobileCoverZoom(corners: FloorCorners, fitZoom: number) {
    const instance = map.value
    if (!instance) return fitZoom
    const cameraKey = `${options.floor.value.id}:${getCoverLayoutKey()}:${instance.getBearing().toFixed(2)}:${instance.getPitch().toFixed(2)}`
    if (cameraKey === coverCameraKey) return coverZoom
    coverZoom = findMobileCoverZoom(corners, getFloorCenter(corners), fitZoom)
    coverCameraKey = cameraKey
    return coverZoom
  }

  function getFloorCamera(corners: FloorCorners, padding: number) {
    const instance = map.value
    if (!instance) return null

    const bounds = getGeoReferenceBounds(corners)
    // A previous Floor's relative constraints must not affect this Floor's camera calculation.
    instance.setMinZoom(ABSOLUTE_ZOOM_LIMITS.minZoom)
    instance.setMaxZoom(ABSOLUTE_ZOOM_LIMITS.maxZoom)
    if (options.mode === 'view' && options.visitorOverview?.value && container.value) {
      return instance.cameraForBounds([bounds.southwest, bounds.northeast], {
        padding: measureVisitorFitPadding(container.value), bearing: 0, pitch: 0, maxZoom: 20,
      })
    }
    if (options.mode === 'edit') {
      return instance.cameraForBounds([bounds.southwest, bounds.northeast], {
        padding,
        bearing: 0,
        pitch: 0,
        maxZoom: 20,
      })
    }

    // cameraForBounds computes a level-map rectangle. At pitch it can leave the
    // illustrated floor's near edge outside the viewport, so fit the projected
    // four corners against the actual MapLibre camera instead.
    const previous = {
      center: instance.getCenter(),
      zoom: instance.getZoom(),
      bearing: instance.getBearing(),
      pitch: instance.getPitch(),
    }
    const center = getFloorCenter(corners)
    const width = container.value?.clientWidth ?? 0
    const height = container.value?.clientHeight ?? 0
    const coordinates = toImageCoordinates(corners)
    let low: number = ABSOLUTE_ZOOM_LIMITS.minZoom
    let high: number = 20
    try {
      for (let index = 0; index < 19; index += 1) {
        const zoom = (low + high) / 2
        instance.jumpTo({ center: [center.lng, center.lat], zoom, bearing: 0, pitch: previous.pitch })
        const projected = coordinates.map(coordinate => instance.project(coordinate))
        const fits = projected.every(point => point.x >= padding
          && point.x <= width - padding
          && point.y >= padding
          && point.y <= height - padding)
        if (fits) low = zoom
        else high = zoom
      }
    }
    finally {
      instance.jumpTo(previous)
    }
    return { center: [center.lng, center.lat] as [number, number], zoom: low }
  }

  function updateFloorZoomConstraints(corners: FloorCorners, preserveInitialZoom = false, initialZoom?: number) {
    const instance = map.value
    if (!instance) return null
    const previousMaxZoom = instance.getMaxZoom()
    const camera = getFloorCamera(corners, options.mode === 'view' ? 24 : 48)
    if (!camera) return null

    const targetZoom = camera.zoom ?? instance.getZoom()
    const zoomConstraints = options.mode === 'view'
      ? createPublicFloorZoomConstraints(
          targetZoom,
          initialZoom ?? (preserveInitialZoom ? previousMaxZoom - ZOOM_IN_ALLOWANCE : targetZoom),
        )
      : createFloorZoomConstraints(targetZoom)
    instance.setMinZoom(zoomConstraints.minZoom)
    instance.setMaxZoom(zoomConstraints.maxZoom)
    return { camera, targetZoom, ...zoomConstraints }
  }

  /**
   * Automatic camera mutations are limited to initial/Floor load, explicit Floor switch,
   * one-shot explicit location policy, explicit focus commands, and an invalid hard-bound clamp.
   */
  function fitFloorBounds(corners: FloorCorners, animate: boolean) {
    const instance = map.value
    if (!instance) return
    if (options.mode === 'view' && options.visitorOverview?.value) {
      // Initial/Floor load applies content framing, never an animated carry-over.
      instance.stop()
      instance.resize()
      // Establish the recovery baseline before pitch events update the compass.
      homePitch = VISITOR_INITIAL_PITCH
      instance.jumpTo({ bearing: 0, pitch: VISITOR_INITIAL_PITCH })
      const result = updateFloorZoomConstraints(corners)
      if (result) {
        const bounds = getVisitorContentBounds(options.floor.value, options.spots?.value ?? [])
        // Match the visitor stage's responsive breakpoint. The canvas container's
        // border makes a 768px stage 766px wide and must not choose mobile zoom.
        const width = container.value?.closest<HTMLElement>('.public-map-stage')?.clientWidth ?? container.value?.clientWidth ?? 1024
        const mobile = width < 768
        const allowance = mobile ? VISITOR_MOBILE_INITIAL_ZOOM_ALLOWANCE : VISITOR_INITIAL_ZOOM_ALLOWANCE
        const fittedContent = bounds ? instance.cameraForBounds(bounds, { padding: measureVisitorFitPadding(container.value!), bearing: 0, maxZoom: result.targetZoom + allowance }) : null
        const content = fittedContent && canUseVisitorContentCamera(result.targetZoom, fittedContent.zoom) ? fittedContent : null
        const requestedZoom = content?.zoom ?? result.targetZoom + (mobile ? VISITOR_MOBILE_INITIAL_FALLBACK_ZOOM_OFFSET : VISITOR_INITIAL_FALLBACK_ZOOM_OFFSET)
        const zoom = clampVisitorInitialZoom(result.targetZoom, requestedZoom, allowance)
        instance.jumpTo({ center: content?.center ?? result.camera.center, zoom, bearing: 0, pitch: homePitch })
      }
      constraintLayoutKey = getConstraintLayoutKey()
      return
    }
    constraintLayoutKey = getConstraintLayoutKey()
    if (usesMobileCover()) {
      const camera = getFloorCamera(corners, 0)
      if (!camera) return
      coverCameraKey = ''
      const center = getFloorCenter(corners)
      const requiredZoom = getRequiredMobileCoverZoom(corners, camera.zoom ?? instance.getZoom())
      const constraints = updateFloorZoomConstraints(corners, false, requiredZoom)
      if (!constraints) return
      jumpToCamera(center, requiredZoom)
      return
    }

    const result = updateFloorZoomConstraints(corners)
    if (!result) return
    instance.easeTo({
      center: result.camera.center,
      zoom: result.targetZoom,
      bearing: instance.getBearing(),
      pitch: instance.getPitch(),
      duration: animate ? 700 : 0,
    })
  }

  function showWholeFloor() {
    const instance = map.value
    const corners = getFloorCorners(options.floor.value)
    if (!instance || !corners || options.mode !== 'view') return

    // Overview establishes a level home; heading recovery must preserve this fitted pitch.
    homePitch = 0
    instance.jumpTo({ bearing: 0, pitch: 0 })
    const result = updateFloorZoomConstraints(corners)
    if (!result) return
    instance.easeTo({
      center: result.camera.center,
      zoom: result.targetZoom,
      bearing: 0,
      pitch: 0,
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350,
    })
  }

  function comparePitch(pitch: 0 | 20 | 25 | 45, fit: boolean, baseline?: MapViewerCameraState) {
    const instance = map.value
    const corners = getFloorCorners(options.floor.value)
    if (!instance || !corners || options.mode !== 'view') return
    if (!fit && baseline) {
      instance.jumpTo({ center: [baseline.center.lng, baseline.center.lat], zoom: baseline.zoom, bearing: 0, pitch })
      return
    }
    instance.jumpTo({ bearing: 0, pitch })
    fitFloorBounds(corners, false)
  }

  function resize() {
    const instance = map.value
    if (!instance) return
    const corners = getFloorCorners(options.floor.value)
    const nextLayoutKey = getConstraintLayoutKey()
    if (!corners || !options.isReady.value) {
      instance.resize()
      constraintLayoutKey = nextLayoutKey
      return
    }

    const result = applyPassiveCameraResize(
      instance,
      constraintLayoutKey,
      nextLayoutKey,
      () => {
        const constraints = updateFloorZoomConstraints(corners, true)
        return constraints ? { minZoom: constraints.minZoom, maxZoom: constraints.maxZoom } : null
      },
    )
    constraintLayoutKey = result.layoutKey
  }

  function resetFloorCamera() {
    coverCameraKey = ''
    constraintLayoutKey = ''
  }

  function getState() {
    if (!map.value) return null
    return getMapViewerCameraState(map.value)
  }

  function restore(camera: MapViewerCameraState) {
    if (map.value) restoreMapViewerCamera(map.value, camera)
  }

  return {
    getHomePitch: () => homePitch,
    fitFloorBounds,
    showWholeFloor,
    comparePitch,
    getState,
    resetFloorCamera,
    resize,
    restore,
  }
}
