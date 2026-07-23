import { onBeforeUnmount, onMounted, readonly, ref, shallowRef, watch, type Ref } from 'vue'
import type { GeolocateControl, Map as MapLibreMap, MapOptions, Marker, StyleSpecification } from 'maplibre-gl'
import { getFloorCorners, getGeoReferenceBounds, isGeoReferenced, isWithinFloorArea, toImageCoordinates, type FloorCorners, type LatLng } from '~~/lib/geo'
import { defaultPinIconId, getPinIconPreset } from '~~/shared/constants/spot'
import type { MapViewerFloor, MapViewerSpot } from '~~/shared/types/map-viewer'
import { getPinColorVariants } from '~~/shared/utils/pin-style'

export type MapViewerMode = 'view' | 'edit'

export const VIEWER_CAMERA_CONSTRAINTS = {
  view: {
    bearing: 0,
    pitch: 45,
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
export const ZOOM_OUT_ALLOWANCE = 2.5
export const ZOOM_IN_ALLOWANCE = 6
export const GEOLOCATION_OUTSIDE_MESSAGE = '現在地はこのマップのエリアから離れているようです'
export const GEOLOCATE_CONTROL_OPTIONS = {
  trackUserLocation: true,
  showUserLocation: false,
  showAccuracyCircle: false,
} as const

export interface UseMapViewerOptions {
  mode: MapViewerMode
  floor: Readonly<Ref<MapViewerFloor>>
  spots: Readonly<Ref<readonly MapViewerSpot[]>>
  position: Readonly<Ref<LatLng | null>>
  selectedSpotId: Readonly<Ref<string | null>>
  onReady?: (map: MapLibreMap) => void
  onPositionChanged?: (position: LatLng) => void
  onSpotMoved?: (value: { spotId: string, lat: number, lng: number }) => void
  onSpotSelected?: (spot: MapViewerSpot) => void
}

export function getSpotMarkerPresentation(spot: MapViewerSpot) {
  const customImageUrl = spot.pinIconType === 'custom' ? spot.pinIconImageUrl : null
  const colors = getPinColorVariants(spot.pinColor)
  return {
    color: colors.base,
    lightColor: colors.light,
    darkColor: colors.dark,
    customImageUrl,
    symbol: customImageUrl
      ? null
      : getPinIconPreset(spot.pinIconId ?? defaultPinIconId(spot.category)).symbol,
  }
}

export function getFloorLayerIds(floorId: string) {
  const sourceId = `floor-${floorId}`
  return {
    sourceId,
    layerId: `${sourceId}-layer`,
  }
}

export function shouldEnableGeolocate(floor: MapViewerFloor) {
  return isGeoReferenced(floor)
}

export function createMapViewerStyle(mode: MapViewerMode): StyleSpecification {
  if (mode === 'edit') {
    return {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap contributors',
        },
      },
      layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
    }
  }

  return {
    version: 8,
    sources: {},
    layers: [{
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#f5f5f4' },
    }],
  }
}

export function createMapViewerOptions(container: HTMLElement | string, mode: MapViewerMode): MapOptions {
  const camera = VIEWER_CAMERA_CONSTRAINTS[mode]
  return {
    container,
    style: createMapViewerStyle(mode),
    center: [0, 0],
    zoom: 1,
    minZoom: ABSOLUTE_ZOOM_LIMITS.minZoom,
    maxZoom: ABSOLUTE_ZOOM_LIMITS.maxZoom,
    ...camera,
  }
}

export function createFloorZoomConstraints(fittedZoom: number) {
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

interface PositionableMarker {
  setLngLat: (lngLat: [number, number]) => unknown
  addTo: (map: MapLibreMap) => unknown
}

export function addMarkerAtPosition<T extends PositionableMarker>(
  marker: T,
  instance: MapLibreMap,
  position: LatLng,
) {
  marker.setLngLat([position.lng, position.lat])
  marker.addTo(instance)
  return marker
}

export function useMapViewer(
  container: Readonly<Ref<HTMLElement | null>>,
  options: UseMapViewerOptions,
) {
  const map = shallowRef<MapLibreMap | null>(null)
  const maplibre = shallowRef<typeof import('maplibre-gl') | null>(null)
  const mapError = ref('')
  const floorError = ref('')
  const isReady = ref(false)
  const geolocationAvailable = ref(false)
  const geolocationAreaMessage = ref('')
  let draftMarker: Marker | null = null
  let spotMarkers: Marker[] = []
  let geolocateControl: GeolocateControl | null = null
  let geolocateHandler: ((position: GeolocationPosition) => void) | null = null
  let currentLocationMarker: Marker | null = null
  let activeSourceId: string | null = null
  let activeLayerId: string | null = null

  async function initialize() {
    if (!container.value || map.value) return

    try {
      const [maplibregl] = await Promise.all([
        import('maplibre-gl'),
        import('maplibre-gl/dist/maplibre-gl.css'),
      ])
      maplibre.value = maplibregl
      const instance = new maplibregl.Map(createMapViewerOptions(container.value, options.mode))
      map.value = instance
      instance.addControl(new maplibregl.NavigationControl({
        showCompass: options.mode === 'view',
        showZoom: true,
        visualizePitch: options.mode === 'view',
      }), 'top-right')

      instance.once('load', () => {
        if (map.value !== instance) return
        isReady.value = true
        showFloor(options.floor.value, false)
        syncSpotMarkers()
        syncDraftMarker(options.position.value)
        syncGeolocateControl(options.floor.value)
        options.onReady?.(instance)
      })

      if (options.mode === 'edit') {
        instance.on('click', (event) => {
          const target = event.originalEvent.target
          if (target instanceof Element && target.closest('.map-viewer-marker')) return

          const position = { lat: event.lngLat.lat, lng: event.lngLat.lng }
          syncDraftMarker(position)
          options.onPositionChanged?.(position)
        })
      }
    }
    catch {
      mapError.value = '地図を初期化できませんでした。WebGLが有効か確認してください。'
      destroy()
    }
  }

  function destroy() {
    draftMarker?.remove()
    draftMarker = null
    spotMarkers.forEach(marker => marker.remove())
    spotMarkers = []
    removeGeolocateControl()
    removeFloorImage()
    map.value?.remove()
    map.value = null
    maplibre.value = null
    isReady.value = false
  }

  function removeGeolocateControl() {
    const instance = map.value
    if (geolocateControl && geolocateHandler) {
      geolocateControl.off('geolocate', geolocateHandler)
    }
    if (instance && geolocateControl && instance.hasControl(geolocateControl)) {
      instance.removeControl(geolocateControl)
    }
    currentLocationMarker?.remove()
    currentLocationMarker = null
    geolocateControl = null
    geolocateHandler = null
    geolocationAvailable.value = false
    geolocationAreaMessage.value = ''
  }

  function syncGeolocateControl(floor: MapViewerFloor) {
    removeGeolocateControl()
    const instance = map.value
    const currentMaplibre = maplibre.value
    if (!instance || !currentMaplibre || !shouldEnableGeolocate(floor)) return

    // 標準マーカーは判定より先に表示されるため無効化し、範囲内だけ独自表示する。
    geolocateControl = new currentMaplibre.GeolocateControl(GEOLOCATE_CONTROL_OPTIONS)
    geolocateHandler = (position) => {
      const corners = getFloorCorners(floor)
      const lat = position.coords.latitude
      const lng = position.coords.longitude
      const isInside = corners !== null && isWithinFloorArea(lat, lng, corners)

      if (!isInside) {
        currentLocationMarker?.remove()
        currentLocationMarker = null
        geolocationAreaMessage.value = GEOLOCATION_OUTSIDE_MESSAGE
        if (corners) fitFloorBounds(corners, true)
        return
      }

      geolocationAreaMessage.value = ''
      if (!currentLocationMarker) {
        const element = document.createElement('div')
        element.className = 'map-viewer-current-location-marker'
        element.setAttribute('role', 'img')
        element.setAttribute('aria-label', '現在地')
        currentLocationMarker = addMarkerAtPosition(
          new currentMaplibre.Marker({ element }),
          instance,
          { lat, lng },
        )
        return
      }
      currentLocationMarker.setLngLat([lng, lat])
    }
    geolocateControl.on('geolocate', geolocateHandler)
    instance.addControl(geolocateControl, 'top-right')
    geolocationAvailable.value = true
  }

  function syncSpotMarkers() {
    spotMarkers.forEach(marker => marker.remove())
    spotMarkers = []

    const instance = map.value
    const currentMaplibre = maplibre.value
    if (!instance || !currentMaplibre || !isReady.value) return

    spotMarkers = options.spots.value.map((spot) => {
      const presentation = getSpotMarkerPresentation(spot)
      const element = document.createElement('button')
      element.type = 'button'
      element.className = 'map-viewer-marker'
      element.classList.toggle('map-viewer-marker--selected', spot.id === options.selectedSpotId.value)
      element.style.setProperty('--pin-color', presentation.color)
      element.style.setProperty('--pin-color-light', presentation.lightColor)
      element.style.setProperty('--pin-color-dark', presentation.darkColor)
      element.setAttribute('aria-label', options.mode === 'edit'
        ? `${spot.name}をドラッグして位置調整`
        : `${spot.name}の詳細を表示`)
      element.title = spot.name

      const shape = document.createElement('span')
      shape.className = 'map-viewer-marker__shape'
      const content = document.createElement(presentation.customImageUrl ? 'img' : 'span')
      content.className = 'map-viewer-marker__content'
      if (content instanceof HTMLImageElement && presentation.customImageUrl) {
        content.src = presentation.customImageUrl
        content.alt = ''
      }
      else {
        content.textContent = presentation.symbol
      }
      shape.append(content)
      element.append(shape)
      element.addEventListener('click', (event) => {
        event.stopPropagation()
        options.onSpotSelected?.(spot)
      })

      const marker = new currentMaplibre.Marker({
        element,
        draggable: options.mode === 'edit',
      })
        .setLngLat([spot.lng, spot.lat])
        .addTo(instance)

      if (options.mode === 'edit') {
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat()
          options.onSpotMoved?.({ spotId: spot.id, lat: lngLat.lat, lng: lngLat.lng })
        })
      }

      return marker
    })
  }

  function syncDraftMarker(position: LatLng | null) {
    if (options.mode !== 'edit') return
    const instance = map.value
    const currentMaplibre = maplibre.value
    if (!instance || !currentMaplibre || !isReady.value) return

    if (!position) {
      draftMarker?.remove()
      draftMarker = null
      return
    }

    if (!draftMarker) {
      draftMarker = addMarkerAtPosition(
        new currentMaplibre.Marker({ color: '#C7401F' }),
        instance,
        position,
      )
      return
    }
    draftMarker.setLngLat([position.lng, position.lat])
  }

  function removeFloorImage() {
    const instance = map.value
    if (!instance) return

    if (activeLayerId && instance.getLayer(activeLayerId)) {
      instance.removeLayer(activeLayerId)
    }
    if (activeSourceId && instance.getSource(activeSourceId)) {
      instance.removeSource(activeSourceId)
    }
    activeLayerId = null
    activeSourceId = null
  }

  function fitFloorBounds(corners: FloorCorners, animate: boolean) {
    const instance = map.value
    if (!instance) return

    const bounds = getGeoReferenceBounds(corners)
    // 前のフロアの相対制約がカメラ計算へ影響しないよう、毎回いったん解除する。
    instance.setMinZoom(ABSOLUTE_ZOOM_LIMITS.minZoom)
    instance.setMaxZoom(ABSOLUTE_ZOOM_LIMITS.maxZoom)
    const camera = instance.cameraForBounds([bounds.southwest, bounds.northeast], {
      padding: 64,
      maxZoom: 20,
    })
    if (!camera) return

    const targetZoom = camera.zoom ?? instance.getZoom()
    const zoomConstraints = createFloorZoomConstraints(targetZoom)
    instance.setMinZoom(zoomConstraints.minZoom)
    instance.setMaxZoom(zoomConstraints.maxZoom)
    instance.easeTo({
      center: camera.center,
      zoom: targetZoom,
      bearing: instance.getBearing(),
      pitch: instance.getPitch(),
      duration: animate ? 700 : 0,
    })
  }

  function showFloor(floor: MapViewerFloor, animate = true) {
    const instance = map.value
    const corners = getFloorCorners(floor)
    if (!instance || !isReady.value) return false

    removeFloorImage()

    if (!corners) {
      floorError.value = 'このフロアは2点合わせが未設定、または正しくありません。'
      return false
    }

    floorError.value = ''
    const { sourceId, layerId } = getFloorLayerIds(floor.id)
    instance.addSource(sourceId, {
      type: 'image',
      url: floor.illustrationUrl,
      coordinates: toImageCoordinates(corners),
    })
    instance.addLayer({
      id: layerId,
      type: 'raster',
      source: sourceId,
      paint: { 'raster-opacity': options.mode === 'edit' ? 0.82 : 1 },
    })
    activeSourceId = sourceId
    activeLayerId = layerId

    fitFloorBounds(corners, animate)
    return true
  }

  onMounted(initialize)
  onBeforeUnmount(destroy)

  watch(() => options.spots.value, syncSpotMarkers, { deep: true })
  watch(() => options.position.value, syncDraftMarker, { deep: true })
  watch(() => options.selectedSpotId.value, syncSpotMarkers)
  watch(() => options.floor.value, (floor) => {
    if (!isReady.value) return
    showFloor(floor, true)
    syncSpotMarkers()
    syncDraftMarker(options.position.value)
    syncGeolocateControl(floor)
  }, { deep: true })

  return {
    map: readonly(map),
    mapError: readonly(mapError),
    floorError: readonly(floorError),
    isReady: readonly(isReady),
    geolocationAvailable: readonly(geolocationAvailable),
    geolocationAreaMessage: readonly(geolocationAreaMessage),
    initialize,
    destroy,
    showFloor,
    removeFloorImage,
    syncGeolocateControl,
    syncSpotMarkers,
    syncDraftMarker,
  }
}
