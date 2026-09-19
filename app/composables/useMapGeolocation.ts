import { readonly, ref, type Ref } from 'vue'
import type { GeolocateControl, GeolocatePositionEvent, IControl, Map as MapLibreMap, Marker } from 'maplibre-gl'
import { getFloorCorners, isGeoReferenced, isWithinFloorArea } from '~~/lib/geo'
import type { MapViewerFloor } from '~~/shared/types/map-viewer'
import type { MapViewerMode } from './useMapCamera'

export const GEOLOCATION_OUTSIDE_MESSAGE = '現在地はこのマップから離れています'
export const GEOLOCATION_TOAST_DURATION_MS = 5_000
export const GEOLOCATE_CONTROL_OPTIONS = {
  trackUserLocation: true,
  showUserLocation: false,
  showAccuracyCircle: false,
} as const

export interface GeolocationNoticeState {
  requestId: number
  notifiedRequestId: number | null
}

export function beginGeolocationRequest(state: GeolocationNoticeState): GeolocationNoticeState {
  return { ...state, requestId: state.requestId + 1 }
}

export function consumeOutsideGeolocation(state: GeolocationNoticeState) {
  if (state.requestId === 0 || state.notifiedRequestId === state.requestId) {
    return { state, notify: false, requestId: state.requestId }
  }
  return {
    state: { ...state, notifiedRequestId: state.requestId },
    notify: true,
    requestId: state.requestId,
  }
}

export function shouldEnableGeolocate(floor: MapViewerFloor) {
  return isGeoReferenced(floor)
}

interface ControlGroup extends IControl {
  getElement: () => HTMLElement | null
}

interface UseMapGeolocationOptions {
  mode: MapViewerMode
  map: Readonly<Ref<MapLibreMap | null>>
  maplibre: Readonly<Ref<typeof import('maplibre-gl') | null>>
  createBaseControls: () => IControl[]
  createControlGroup: (controls: IControl[]) => ControlGroup
  onExplicitRequest?: (requestId: number) => void
  onOutsideResult?: (result: { requestId: number, firstForRequest: boolean }) => void
  onReset?: () => void
}

export function useMapGeolocation(options: UseMapGeolocationOptions) {
  const geolocationAvailable = ref(false)
  const geolocationAreaMessage = ref('')
  let geolocateControl: GeolocateControl | null = null
  let mapControlGroup: ControlGroup | null = null
  let geolocateHandler: ((position: GeolocatePositionEvent) => void) | null = null
  let geolocateButton: HTMLButtonElement | null = null
  let geolocateButtonHandler: (() => void) | null = null
  let noticeState: GeolocationNoticeState = { requestId: 0, notifiedRequestId: null }
  let toastTimer: number | null = null
  let currentLocationMarker: Marker | null = null

  function clearToast() {
    if (toastTimer !== null) window.clearTimeout(toastTimer)
    toastTimer = null
    geolocationAreaMessage.value = ''
  }

  function showToast() {
    clearToast()
    geolocationAreaMessage.value = GEOLOCATION_OUTSIDE_MESSAGE
    toastTimer = window.setTimeout(() => {
      geolocationAreaMessage.value = ''
      toastTimer = null
    }, GEOLOCATION_TOAST_DURATION_MS)
  }

  function removeControl() {
    const instance = options.map.value
    if (geolocateControl && geolocateHandler) geolocateControl.off('geolocate', geolocateHandler)
    if (instance && mapControlGroup && instance.hasControl(mapControlGroup)) instance.removeControl(mapControlGroup)
    if (geolocateButton && geolocateButtonHandler) geolocateButton.removeEventListener('click', geolocateButtonHandler)
    geolocateButton = null
    geolocateButtonHandler = null
    currentLocationMarker?.remove()
    currentLocationMarker = null
    geolocateControl = null
    mapControlGroup = null
    geolocateHandler = null
    noticeState = { requestId: 0, notifiedRequestId: null }
    geolocationAvailable.value = false
    clearToast()
    options.onReset?.()
  }

  function syncControl(floor: MapViewerFloor) {
    removeControl()
    const instance = options.map.value
    const currentMaplibre = options.maplibre.value
    if (!instance || !currentMaplibre) return

    const controls = options.createBaseControls()
    if (options.mode === 'edit' || !shouldEnableGeolocate(floor)) {
      mapControlGroup = options.createControlGroup(controls)
      instance.addControl(mapControlGroup, 'top-right')
      return
    }

    // The standard marker appears before the Floor-area decision, so render our own only when inside.
    geolocateControl = new currentMaplibre.GeolocateControl(GEOLOCATE_CONTROL_OPTIONS)
    geolocateHandler = (position) => {
      const corners = getFloorCorners(floor)
      const lat = position.coords.latitude
      const lng = position.coords.longitude
      const isInside = corners !== null && isWithinFloorArea(lat, lng, corners)

      if (!isInside) {
        currentLocationMarker?.remove()
        currentLocationMarker = null
        const result = consumeOutsideGeolocation(noticeState)
        noticeState = result.state
        options.onOutsideResult?.({ requestId: result.requestId, firstForRequest: result.notify })
        if (result.notify) showToast()
        return
      }

      if (!currentLocationMarker) {
        const element = document.createElement('div')
        element.className = 'map-viewer-current-location-marker'
        element.setAttribute('role', 'img')
        element.setAttribute('aria-label', '現在地')
        currentLocationMarker = new currentMaplibre.Marker({ element })
          .setLngLat([lng, lat])
          .addTo(instance)
        return
      }
      currentLocationMarker.setLngLat([lng, lat])
    }

    geolocateControl.on('geolocate', geolocateHandler)
    controls.push(geolocateControl)
    mapControlGroup = options.createControlGroup(controls)
    instance.addControl(mapControlGroup, 'top-right')
    geolocateButton = mapControlGroup.getElement()?.querySelector<HTMLButtonElement>('.maplibregl-ctrl-geolocate') ?? null
    geolocateButtonHandler = () => {
      noticeState = beginGeolocationRequest(noticeState)
      clearToast()
      options.onExplicitRequest?.(noticeState.requestId)
    }
    geolocateButton?.addEventListener('click', geolocateButtonHandler)
    geolocationAvailable.value = true
  }

  return {
    geolocationAvailable: readonly(geolocationAvailable),
    geolocationAreaMessage: readonly(geolocationAreaMessage),
    removeControl,
    syncControl,
  }
}
