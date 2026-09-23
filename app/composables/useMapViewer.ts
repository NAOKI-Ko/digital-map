import { onBeforeUnmount, onMounted, readonly, ref, shallowRef, watch, type Ref } from 'vue'
import type { IControl, Map as MapLibreMap, Marker, MarkerOptions } from 'maplibre-gl'
import { getFloorCorners, imageToRenderCoordinates, isValidImagePosition, renderToImageCoordinates, toImageCoordinates, type ImagePosition, type LatLng } from '~~/lib/geo'
import { getDecorationRenderCoordinates } from '~~/lib/decoration'
import type { MapViewerCameraState, MapViewerDecoration, MapViewerFloor, MapViewerSpot } from '~~/shared/types/map-viewer'
import { createSpotMarkerElement } from '~/utils/marker-element'
import { applyMarkerDensityPresentation, getMarkerDensityPresentation } from '~/utils/marker-density'
import { getMinimalSpotPan, needsHeadingReset } from '~/utils/public-map-exploration'
import {
  createMapViewerOptions,
  createOneShotLocationCameraPolicy,
  getMapViewerCameraState,
  useMapCamera,
  VIEWER_CAMERA_CONSTRAINTS,
  type MapViewerMode,
} from './useMapCamera'
import { useMapGeolocation } from './useMapGeolocation'

export interface UseMapViewerOptions {
  mode: MapViewerMode
  floor: Readonly<Ref<MapViewerFloor>>
  spots: Readonly<Ref<readonly MapViewerSpot[]>>
  decorations: Readonly<Ref<readonly MapViewerDecoration[]>>
  position: Readonly<Ref<ImagePosition | null>>
  selectedSpotId: Readonly<Ref<string | null>>
  placementEnabled?: Readonly<Ref<boolean>>
  candidateSpot?: Readonly<Ref<MapViewerSpot | null>>
  candidateKind?: Readonly<Ref<'placement' | 'move' | null>>
  prioritizeVisibleSpots?: Readonly<Ref<boolean>>
  mobileCover?: Readonly<Ref<boolean>>
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

interface FlatWarpImageSource {
  setWarp?: (warp: 'flat') => unknown
}

/** Keep the raster image on the same bilinear surface used by canonical PIN coordinates. */
export function setFlatImageSourceWarp(instance: MapLibreMap, sourceId: string) {
  const source = instance.getSource(sourceId) as FlatWarpImageSource | undefined
  source?.setWarp?.('flat')
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
  private updateCompass: (() => void) | null = null

  constructor(
    private readonly homePitch: number = VIEWER_CAMERA_CONSTRAINTS.view.pitch,
    private readonly showWholeFloor?: () => void,
  ) {}

  onAdd(map: MapLibreMap) {
    this.map = map
    const container = document.createElement('div')
    container.className = 'map-viewer-navigation-control'
    const zoomIn = createControlButton('拡大', '+', () => this.map?.zoomIn())
    const zoomOut = createControlButton('縮小', '−', () => this.map?.zoomOut())
    zoomIn.className = 'map-viewer-zoom-control'
    zoomOut.className = 'map-viewer-zoom-control'
    const compass = createControlButton('向きを戻す', 'N', () => this.map?.easeTo({ bearing: 0, pitch: this.homePitch, duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 250 }))
    compass.className = 'map-viewer-compass'
    this.updateCompass = () => { compass.hidden = !needsHeadingReset(map.getBearing(), map.getPitch(), this.homePitch) }
    const overview = this.showWholeFloor ? createControlButton('地図全体を表示', '□', this.showWholeFloor) : null
    if (overview) overview.className = 'map-viewer-overview-control'
    container.append(
      zoomIn,
      zoomOut,
      compass,
      ...(overview ? [overview] : []),
    )
    map.on('rotate', this.updateCompass)
    map.on('pitch', this.updateCompass)
    this.updateCompass()
    this.container = container
    return container
  }

  onRemove(map: MapLibreMap) {
    if (this.updateCompass) {
      map.off('rotate', this.updateCompass)
      map.off('pitch', this.updateCompass)
    }
    this.updateCompass = null
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

  getElement() {
    return this.container
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
  let draftMarker: Marker | null = null
  let spotMarkers: Marker[] = []
  let spotMarkerElements: Array<{ element: HTMLElement, spot: MapViewerSpot }> = []
  let activeSourceId: string | null = null
  let activeLayerId: string | null = null
  let decorationLayers: Array<{ sourceId: string, layerId: string }> = []
  let containerResizeObserver: ResizeObserver | null = null
  let focusSpotTimer: number | null = null
  let comparisonBaseline: MapViewerCameraState | null = null

  const mapCamera = useMapCamera(container, map, {
    mode: options.mode,
    floor: options.floor,
    mobileCover: options.mobileCover,
    isReady,
  })
  const locationCameraPolicy = createOneShotLocationCameraPolicy(
    () => {
      const camera = mapCamera.getState()
      if (!camera) throw new Error('Map camera is unavailable for a location request')
      return camera
    },
    camera => mapCamera.restore(camera),
  )
  const geolocation = useMapGeolocation({
    mode: options.mode,
    map,
    maplibre,
    createBaseControls: () => [new MapNavigationControl(VIEWER_CAMERA_CONSTRAINTS[options.mode].pitch, options.mode === 'view' ? mapCamera.showWholeFloor : undefined)],
    createControlGroup: controls => new HorizontalMapControlGroup(controls),
    onExplicitRequest: () => locationCameraPolicy.beginRequest(),
    onOutsideResult: result => locationCameraPolicy.consumeOutsideResult(result.firstForRequest),
    onReset: () => locationCameraPolicy.reset(),
  })
  const resize = mapCamera.resize
  const syncGeolocateControl = geolocation.syncControl

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
        comparisonBaseline = mapCamera.getState()
        if (options.initialCamera) mapCamera.restore(options.initialCamera)
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
          if (!options.placementEnabled?.value) return
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
    geolocation.removeControl()
    removeFloorImage()
    map.value?.remove()
    map.value = null
    maplibre.value = null
    isReady.value = false
  }

  function syncSpotMarkers() {
    spotMarkers.forEach(marker => marker.remove())
    spotMarkers = []
    spotMarkerElements = []

    const instance = map.value
    const currentMaplibre = maplibre.value
    if (!instance || !currentMaplibre || !isReady.value) return

    const selectedIsPositioned = options.spots.value.some(spot => spot.id === options.selectedSpotId.value)
    const candidateKind = options.candidateKind?.value ?? null
    spotMarkers = options.spots.value.flatMap((spot) => {
      const renderPosition = imageToRenderCoordinates(options.floor.value, spot)
      if (!renderPosition) return []
      const selected = spot.id === options.selectedSpotId.value
      const ghost = candidateKind === 'move' && selected
      const element = createSpotMarkerElement(spot, {
        mode: options.mode,
        selected: selected && !ghost,
        ghost,
        dimmed: selectedIsPositioned && !selected,
        stronglyDimmed: Boolean(candidateKind) && !selected,
        onSelected: () => options.onSpotSelected?.(spot),
      })
      spotMarkerElements.push({ element, spot })

      const marker = new currentMaplibre.Marker(createSpotMarkerOptions(element, options.mode, false))
        .setLngLat([renderPosition.lng, renderPosition.lat])
        .addTo(instance)

      return marker
    })
    syncMarkerDensity()
  }

  function syncSpotMarkerSelection() {
    const selectedId = options.selectedSpotId.value
    const selectedIsPositioned = options.spots.value.some(spot => spot.id === selectedId)
    spotMarkerElements.forEach(({ element, spot }) => {
      const selected = spot.id === selectedId
      element.classList.toggle('map-viewer-marker--selected', selected)
      element.classList.toggle('map-viewer-marker--dimmed', selectedIsPositioned && !selected)
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

    const candidateSpot = options.candidateSpot?.value
    const candidateKind = options.candidateKind?.value
    const candidatePosition = position ?? (candidateKind === 'move' ? candidateSpot : null)
    const renderPosition = candidatePosition
      ? imageToRenderCoordinates(options.floor.value, candidatePosition)
      : null
    draftMarker?.remove()
    draftMarker = null
    if (!renderPosition || !candidateSpot || !candidateKind) {
      return
    }

    const element = createSpotMarkerElement(candidateSpot, {
      mode: 'edit',
      selected: false,
      draggable: true,
      candidate: candidateKind,
    })
    const marker = addMarkerAtPosition(
      new currentMaplibre.Marker(createSpotMarkerOptions(element, 'edit', true)),
      instance,
      renderPosition,
    )
    marker.on('dragend', () => {
      const lngLat = marker.getLngLat()
      const candidate = constrainImagePlacementCandidate(options.floor.value, lngLat)
      if (!candidate) return
      const constrainedRenderPosition = imageToRenderCoordinates(options.floor.value, candidate)
      if (constrainedRenderPosition) marker.setLngLat([constrainedRenderPosition.lng, constrainedRenderPosition.lat])
      options.onPositionChanged?.(candidate)
      options.onSpotMoved?.({ spotId: candidateSpot.id, ...candidate })
    })
    draftMarker = marker
  }

  function focusSpot(spotId: string) {
    const instance = map.value
    const spot = options.spots.value.find(item => item.id === spotId)
    const renderPosition = spot && imageToRenderCoordinates(options.floor.value, spot)
    if (!instance || !renderPosition) return false

    const zoom = Math.min(instance.getMaxZoom(), Math.max(instance.getZoom(), instance.getMinZoom() + 2))
    instance.easeTo({ center: [renderPosition.lng, renderPosition.lat], zoom, duration: 600 })
    if (focusSpotTimer !== null) window.clearTimeout(focusSpotTimer)
    focusSpotTimer = window.setTimeout(() => {
      focusSpotTimer = null
      spotMarkerElements.find(item => item.spot.id === spotId)?.element.focus()
    }, 650)
    return true
  }

  function ensureSpotVisible(spotId: string, panel: DOMRect | null) {
    const instance = map.value
    const frame = container.value
    const spot = options.spots.value.find(item => item.id === spotId)
    const position = spot && imageToRenderCoordinates(options.floor.value, spot)
    if (!instance || !frame || !position || !panel || options.mode !== 'view') return false

    const frameRect = frame.getBoundingClientRect()
    const point = instance.project([position.lng, position.lat])
    const [dx, dy] = getMinimalSpotPan(
      point,
      { width: frameRect.width, height: frameRect.height },
      { left: panel.left - frameRect.left, top: panel.top - frameRect.top },
    )
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return false
    // MapLibre panBy moves the camera center; the projected PIN moves in the
    // opposite screen direction from the requested camera offset.
    instance.panBy([-dx, -dy], { duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 250 })
    return true
  }

  function compareCamera(pitch: 0 | 20 | 45, fit: boolean) {
    if (options.mode !== 'view') return
    mapCamera.comparePitch(pitch, fit, comparisonBaseline ?? undefined)
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
      setFlatImageSourceWarp(instance, sourceId)
      instance.addLayer({ id: layerId, type: 'raster', source: sourceId })
      decorationLayers.push({ sourceId, layerId })
    })
  }

  function showFloor(floor: MapViewerFloor, animate = true) {
    const instance = map.value
    const corners = getFloorCorners(floor)
    if (!instance || !isReady.value) return false

    removeFloorImage()
    mapCamera.resetFloorCamera()

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
    setFlatImageSourceWarp(instance, sourceId)
    instance.addLayer({
      id: layerId,
      type: 'raster',
      source: sourceId,
      paint: { 'raster-opacity': 1 },
    })
    activeSourceId = sourceId
    activeLayerId = layerId
    syncDecorations()

    mapCamera.fitFloorBounds(corners, animate)
    return true
  }

  onMounted(() => {
    void initialize()
    window.addEventListener('admin-sidebar-resize', resize)
    if (typeof ResizeObserver !== 'undefined' && container.value) {
      containerResizeObserver = new ResizeObserver(resize)
      containerResizeObserver.observe(container.value)
    }
  })
  onBeforeUnmount(() => {
    window.removeEventListener('admin-sidebar-resize', resize)
    containerResizeObserver?.disconnect()
    containerResizeObserver = null
    if (focusSpotTimer !== null) window.clearTimeout(focusSpotTimer)
    focusSpotTimer = null
    destroy()
  })

  watch(() => options.spots.value, syncSpotMarkers, { deep: true })
  watch(() => options.decorations.value, syncDecorations, { deep: true })
  watch(() => options.position.value, syncDraftMarker, { deep: true })
  // Recreating markers during their click handler can retarget the same click to an
  // overlapping marker. Selection is presentation-only, so keep marker DOM stable.
  watch(() => options.selectedSpotId.value, syncSpotMarkerSelection)
  if (options.candidateSpot) watch(() => options.candidateSpot?.value, () => syncDraftMarker(options.position.value), { deep: true })
  if (options.candidateKind) watch(() => options.candidateKind?.value, () => {
    syncSpotMarkers()
    syncDraftMarker(options.position.value)
  })
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
    geolocationAvailable: geolocation.geolocationAvailable,
    geolocationAreaMessage: geolocation.geolocationAreaMessage,
    initialize,
    resize,
    destroy,
    showFloor,
    removeFloorImage,
    syncGeolocateControl,
    syncSpotMarkers,
    syncMarkerDensity,
    syncDraftMarker,
    focusSpot,
    ensureSpotVisible,
    compareCamera,
  }
}
