import { onBeforeUnmount, onMounted, readonly, ref, shallowRef, watch, type Ref } from 'vue'
import type { GeolocateControl, IControl, Map as MapLibreMap, MapOptions, Marker, MarkerOptions, StyleSpecification } from 'maplibre-gl'
import { getFloorCorners, getGeoReferenceBounds, imageToRenderCoordinates, isGeoReferenced, isValidImagePosition, isWithinFloorArea, renderToImageCoordinates, toImageCoordinates, type FloorCorners, type ImagePosition, type LatLng } from '~~/lib/geo'
import { getDecorationRenderCoordinates } from '~~/lib/decoration'
import type { MapViewerCameraState, MapViewerDecoration, MapViewerFloor, MapViewerSpot } from '~~/shared/types/map-viewer'
import { createSpotMarkerElement } from '~/utils/marker-element'
import { applyMarkerDensityPresentation, getMarkerDensityPresentation } from '~/utils/marker-density'

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
  decorations: Readonly<Ref<readonly MapViewerDecoration[]>>
  position: Readonly<Ref<ImagePosition | null>>
  selectedSpotId: Readonly<Ref<string | null>>
  draggableSpotId?: Readonly<Ref<string | null>>
  prioritizeVisibleSpots?: Readonly<Ref<boolean>>
  initialCamera?: MapViewerCameraState | null
  onReady?: (map: MapLibreMap) => void
  onCameraChanged?: (camera: MapViewerCameraState) => void
  onPositionChanged?: (position: ImagePosition) => void
  onSpotMoved?: (value: { spotId: string, x: number, y: number }) => void
  onSpotSelected?: (spot: MapViewerSpot) => void
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
    // Disable conflicting double-click gestures; buttons and pinch/touch zoom remain native MapLibre controls.
    doubleClickZoom: false,
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

export function getImagePlacementCandidate(floor: MapViewerFloor, position: LatLng) {
  const candidate = renderToImageCoordinates(floor, position)
  return candidate && isValidImagePosition(candidate) ? candidate : null
}

export function constrainImagePlacementCandidate(floor: MapViewerFloor, position: LatLng) {
  const candidate = renderToImageCoordinates(floor, position)
  if (!candidate) return null
  return {
    x: Math.min(1, Math.max(0, candidate.x)),
    y: Math.min(1, Math.max(0, candidate.y)),
  }
}

export function createSpotMarkerOptions(element: HTMLElement, mode: MapViewerMode, draggable = mode === 'edit'): MarkerOptions {
  return {
    element,
    anchor: 'bottom',
    draggable,
    subpixelPositioning: true,
  }
}

export function createDraftMarkerOptions(): MarkerOptions {
  return {
    color: '#C7401F',
    subpixelPositioning: true,
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

function createControlButton(label: string, text: string, action: () => void) {
  const button = document.createElement('button')
  button.type = 'button'
  button.title = label
  button.setAttribute('aria-label', label)
  button.textContent = text
  button.addEventListener('click', action)
  return button
}

export class MapNavigationControl implements IControl {
  private map: MapLibreMap | null = null
  private container: HTMLElement | null = null

  onAdd(map: MapLibreMap) {
    this.map = map
    const container = document.createElement('div')
    container.className = 'map-viewer-navigation-control'
    container.append(
      createControlButton('拡大', '+', () => this.map?.zoomIn()),
      createControlButton('縮小', '−', () => this.map?.zoomOut()),
      createControlButton('方位をリセット', 'N', () => this.map?.easeTo({ bearing: 0, pitch: 0 })),
    )
    this.container = container
    return container
  }

  onRemove(_map: MapLibreMap) {
    this.container?.remove()
    this.container = null
    this.map = null
  }
}

export class HorizontalMapControlGroup implements IControl {
  private container: HTMLElement | null = null

  constructor(private readonly controls: IControl[]) {}

  onAdd(map: MapLibreMap) {
    const container = document.createElement('div')
    container.className = 'maplibregl-ctrl map-viewer-control-group'
    this.controls.forEach(control => container.appendChild(control.onAdd(map)))
    this.container = container
    return container
  }

  onRemove(map: MapLibreMap) {
    this.controls.toReversed().forEach(control => control.onRemove(map))
    this.container?.remove()
    this.container = null
  }
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
  let spotMarkerElements: Array<{ element: HTMLElement, spot: MapViewerSpot }> = []
  let geolocateControl: GeolocateControl | null = null
  let mapControlGroup: HorizontalMapControlGroup | null = null
  let geolocateHandler: ((position: GeolocationPosition) => void) | null = null
  let currentLocationMarker: Marker | null = null
  let activeSourceId: string | null = null
  let activeLayerId: string | null = null
  let decorationLayers: Array<{ sourceId: string, layerId: string }> = []

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
      instance.once('load', () => {
        if (map.value !== instance) return
        isReady.value = true
        showFloor(options.floor.value, false)
        if (options.initialCamera) restoreMapViewerCamera(instance, options.initialCamera)
        syncSpotMarkers()
        instance.on('zoom', syncMarkerDensity)
        syncDraftMarker(options.position.value)
        syncGeolocateControl(options.floor.value)
        options.onCameraChanged?.(getMapViewerCameraState(instance))
        instance.on('moveend', () => {
          options.onCameraChanged?.(getMapViewerCameraState(instance))
        })
        options.onReady?.(instance)
      })

      if (options.mode === 'edit') {
        instance.on('click', (event) => {
          const target = event.originalEvent.target
          if (target instanceof Element && target.closest('.map-viewer-marker')) return

          const position = getImagePlacementCandidate(options.floor.value, event.lngLat)
          if (!position) return
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
    spotMarkerElements = []
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
    if (instance && mapControlGroup && instance.hasControl(mapControlGroup)) {
      instance.removeControl(mapControlGroup)
    }
    currentLocationMarker?.remove()
    currentLocationMarker = null
    geolocateControl = null
    mapControlGroup = null
    geolocateHandler = null
    geolocationAvailable.value = false
    geolocationAreaMessage.value = ''
  }

  function syncGeolocateControl(floor: MapViewerFloor) {
    removeGeolocateControl()
    const instance = map.value
    const currentMaplibre = maplibre.value
    if (!instance || !currentMaplibre) return

    const controls: IControl[] = [new MapNavigationControl()]
    if (!shouldEnableGeolocate(floor)) {
      mapControlGroup = new HorizontalMapControlGroup(controls)
      instance.addControl(mapControlGroup, 'top-right')
      return
    }

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
    controls.push(geolocateControl)
    mapControlGroup = new HorizontalMapControlGroup(controls)
    instance.addControl(mapControlGroup, 'top-right')
    geolocationAvailable.value = true
  }

  function syncSpotMarkers() {
    spotMarkers.forEach(marker => marker.remove())
    spotMarkers = []
    spotMarkerElements = []

    const instance = map.value
    const currentMaplibre = maplibre.value
    if (!instance || !currentMaplibre || !isReady.value) return

    spotMarkers = options.spots.value.flatMap((spot) => {
      const renderPosition = imageToRenderCoordinates(options.floor.value, spot)
      if (!renderPosition) return []
      const element = createSpotMarkerElement(spot, {
        mode: options.mode,
        selected: spot.id === options.selectedSpotId.value,
        onSelected: () => options.onSpotSelected?.(spot),
      })
      spotMarkerElements.push({ element, spot })

      const isDraggable = options.mode === 'edit' && options.draggableSpotId?.value === spot.id
      const marker = new currentMaplibre.Marker(createSpotMarkerOptions(element, options.mode, isDraggable))
        .setLngLat([renderPosition.lng, renderPosition.lat])
        .addTo(instance)

      if (isDraggable) {
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat()
          const position = constrainImagePlacementCandidate(options.floor.value, lngLat)
          if (!position) return
          const constrainedRenderPosition = imageToRenderCoordinates(options.floor.value, position)
          if (constrainedRenderPosition) marker.setLngLat([constrainedRenderPosition.lng, constrainedRenderPosition.lat])
          options.onSpotMoved?.({ spotId: spot.id, ...position })
        })
      }

      return marker
    })
    syncMarkerDensity()
  }

  function syncMarkerDensity() {
    const instance = map.value
    if (!instance) return
    const zoom = instance.getZoom()
    const minimumZoom = instance.getMinZoom()
    spotMarkerElements.forEach(({ element, spot }) => {
      applyMarkerDensityPresentation(element, getMarkerDensityPresentation(
        spot.importance,
        spot.pinSize ?? 'medium',
        zoom,
        minimumZoom,
        options.mode === 'edit' || spot.id === options.selectedSpotId.value,
        options.prioritizeVisibleSpots?.value ?? false,
      ))
    })
  }

  function syncDraftMarker(position: ImagePosition | null) {
    if (options.mode !== 'edit') return
    const instance = map.value
    const currentMaplibre = maplibre.value
    if (!instance || !currentMaplibre || !isReady.value) return

    const renderPosition = position
      ? imageToRenderCoordinates(options.floor.value, position)
      : null
    if (!renderPosition) {
      draftMarker?.remove()
      draftMarker = null
      return
    }

    if (!draftMarker) {
      draftMarker = addMarkerAtPosition(
        new currentMaplibre.Marker(createDraftMarkerOptions()),
        instance,
        renderPosition,
      )
      return
    }
    draftMarker.setLngLat([renderPosition.lng, renderPosition.lat])
  }

  function removeFloorImage() {
    const instance = map.value
    if (!instance) return

    decorationLayers.toReversed().forEach(({ sourceId, layerId }) => {
      if (instance.getLayer(layerId)) instance.removeLayer(layerId)
      if (instance.getSource(sourceId)) instance.removeSource(sourceId)
    })
    decorationLayers = []
    if (activeLayerId && instance.getLayer(activeLayerId)) {
      instance.removeLayer(activeLayerId)
    }
    if (activeSourceId && instance.getSource(activeSourceId)) {
      instance.removeSource(activeSourceId)
    }
    activeLayerId = null
    activeSourceId = null
  }

  function syncDecorations() {
    const instance = map.value
    if (!instance || !isReady.value) return
    decorationLayers.toReversed().forEach(({ sourceId, layerId }) => {
      if (instance.getLayer(layerId)) instance.removeLayer(layerId)
      if (instance.getSource(sourceId)) instance.removeSource(sourceId)
    })
    decorationLayers = []
    options.decorations.value.toSorted((a, b) => a.order - b.order).forEach((decoration) => {
      const coordinates = getDecorationRenderCoordinates(options.floor.value, decoration)
      if (!coordinates) return
      const sourceId = `decoration-${decoration.id}`
      const layerId = `${sourceId}-layer`
      instance.addSource(sourceId, { type: 'image', url: decoration.imageUrl, coordinates })
      instance.addLayer({ id: layerId, type: 'raster', source: sourceId })
      decorationLayers.push({ sourceId, layerId })
    })
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
    syncDecorations()

    fitFloorBounds(corners, animate)
    return true
  }

  onMounted(initialize)
  onBeforeUnmount(destroy)

  watch(() => options.spots.value, syncSpotMarkers, { deep: true })
  watch(() => options.decorations.value, syncDecorations, { deep: true })
  watch(() => options.position.value, syncDraftMarker, { deep: true })
  watch(() => options.selectedSpotId.value, syncSpotMarkers)
  if (options.draggableSpotId) watch(() => options.draggableSpotId?.value, syncSpotMarkers)
  if (options.prioritizeVisibleSpots) watch(() => options.prioritizeVisibleSpots?.value, syncMarkerDensity)
  watch(() => options.floor.value.id, () => {
    if (!isReady.value) return
    const floor = options.floor.value
    showFloor(floor, true)
    syncSpotMarkers()
    syncDraftMarker(options.position.value)
    syncGeolocateControl(floor)
  })

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
    syncMarkerDensity,
    syncDraftMarker,
  }
}
