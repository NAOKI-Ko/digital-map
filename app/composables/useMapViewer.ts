import { onBeforeUnmount, onMounted, readonly, ref, shallowRef, watch, type Ref } from 'vue'
import type { IControl, ImageSource, Map as MapLibreMap, Marker, MarkerOptions } from 'maplibre-gl'
import { getFloorCorners, imageToRenderCoordinates, isValidImagePosition, renderToImageCoordinates, toImageCoordinates, type ImagePosition, type LatLng } from '~~/lib/geo'
import { getDecorationRenderCoordinates } from '~~/lib/decoration'
import type { MapViewerCameraState, MapViewerDecoration, MapViewerFloor, MapViewerSpot } from '~~/shared/types/map-viewer'
import { createSpotMarkerElement } from '~/utils/marker-element'
import { applyMarkerDensityPresentation, getMarkerDensityPresentation } from '~/utils/marker-density'
import { applyPinVisibility, declutterPins, getCollisionRepresentatives, measurePinRect, measurePinVisualRect, VISITOR_PIN_COLLISION_GAP } from '~/utils/marker-collision'
import { monitorFloorImage } from '~/utils/floor-image-state'
import { getMinimalSpotPan, needsHeadingReset } from '~/utils/public-map-exploration'
import { measureVisitorFitPadding } from '~/utils/visitor-floor-fit'
import {
  createMapViewerOptions,
  createOneShotLocationCameraPolicy,
  getMapViewerCameraState,
  useMapCamera,
  VIEWER_CAMERA_CONSTRAINTS,
  type MapViewerMode,
} from './useMapCamera'
import { useMapCollisionRecovery } from './useMapCollisionRecovery'
import { useMapGeolocation } from './useMapGeolocation'
import { watchViewerFloorRendering } from './watchViewerFloorRendering'

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
  visitorOverview?: Readonly<Ref<boolean>>
  locale?: Readonly<Ref<'ja' | 'en'>>
  initialSpots?: Readonly<Ref<readonly MapViewerSpot[]>>
  mobileCover?: Readonly<Ref<boolean>>
  initialCamera?: MapViewerCameraState | null
  onReady?: (map: MapLibreMap) => void
  onCameraChanged?: (camera: MapViewerCameraState) => void
  onPositionChanged?: (position: ImagePosition) => void
  onSpotMoved?: (value: { spotId: string, x: number, y: number }) => void
  onCollisionStarted?: () => void
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

export function syncMapNavigationLabels(container: HTMLElement, locale: 'ja' | 'en') {
  const labels = [
    ['.map-viewer-zoom-in', '拡大', 'Zoom in'],
    ['.map-viewer-zoom-out', '縮小', 'Zoom out'],
    ['.map-viewer-compass', '向きを戻す', 'Reset heading'],
    ['.map-viewer-overview-control', '地図全体を表示', 'Show whole map'],
  ] as const
  for (const [selector, ja, en] of labels) {
    const button = container.querySelector<HTMLElement>(selector)
    if (!button) continue
    const label = locale === 'en' ? en : ja
    for (const attribute of ['title', 'aria-label']) {
      if (button.getAttribute(attribute) !== label) button.setAttribute(attribute, label)
    }
    if (selector === '.map-viewer-overview-control') {
      const text = locale === 'en' ? 'All' : '全体'
      if (button.textContent !== text) button.textContent = text
    }
  }
}

export class MapNavigationControl implements IControl {
  private map: MapLibreMap | null = null
  private container: HTMLElement | null = null
  private updateCompass: (() => void) | null = null
  private requestedZoom: number | null = null
  private finishZoom = () => { this.requestedZoom = null }

  constructor(
    private readonly homePitch: () => number = () => VIEWER_CAMERA_CONSTRAINTS.view.pitch,
    private readonly showWholeFloor?: () => void,
    private readonly onInteraction: () => void = () => {},
    private readonly visitor = false,
    private readonly locale: () => 'ja' | 'en' = () => 'ja',
  ) {}

  onAdd(map: MapLibreMap) {
    this.map = map
    const container = document.createElement('div')
    container.className = 'map-viewer-navigation-control'
    const zoom = (delta: number) => {
      this.onInteraction()
      if (!this.visitor) {
        if (delta > 0) map.zoomIn()
        else map.zoomOut()
        return
      }
      const target = Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), (this.requestedZoom ?? map.getZoom()) + delta))
      map.stop()
      this.requestedZoom = target
      map.easeTo({ zoom: target, duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 140 })
    }
    const zoomIn = createControlButton('拡大', '+', () => zoom(1))
    const zoomOut = createControlButton('縮小', '−', () => zoom(-1))
    zoomIn.className = 'map-viewer-zoom-control map-viewer-zoom-in'
    zoomOut.className = 'map-viewer-zoom-control map-viewer-zoom-out'
    const compass = createControlButton('向きを戻す', 'N', () => { this.onInteraction(); this.map?.easeTo({ bearing: 0, pitch: this.homePitch(), duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : this.visitor ? 180 : 250 }) })
    compass.className = 'map-viewer-compass'
    this.updateCompass = () => { compass.hidden = !needsHeadingReset(map.getBearing(), map.getPitch(), this.homePitch()) }
    const overview = this.showWholeFloor ? createControlButton('地図全体を表示', this.visitor ? '全体' : '□', () => { this.onInteraction(); this.showWholeFloor?.() }) : null
    if (overview) overview.className = 'map-viewer-overview-control'
    container.append(
      zoomIn,
      zoomOut,
      compass,
      ...(overview ? [overview] : []),
    )
    map.on('rotate', this.updateCompass)
    map.on('pitch', this.updateCompass)
    map.on('moveend', this.finishZoom)
    this.updateCompass()
    this.container = container
    if (this.visitor) syncMapNavigationLabels(container, this.locale())
    return container
  }

  onRemove(map: MapLibreMap) {
    map.off('moveend', this.finishZoom)
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
  const floorImageState = ref<'idle' | 'loading' | 'loaded' | 'error'>('idle')
  const isReady = ref(false)
  let draftMarker: Marker | null = null
  let spotMarkers: Marker[] = []
  let spotMarkerElements: Array<{ element: HTMLElement, spot: MapViewerSpot }> = []
  let activeSourceId: string | null = null
  let activeLayerId: string | null = null
  let decorationLayers: Array<{ sourceId: string, layerId: string }> = []
  let containerResizeObserver: ResizeObserver | null = null
  let focusSpotTimer: number | null = null
  let collisionFrame: number | null = null
  let collisionCandidates: import('~/utils/marker-collision').CollisionCandidate[] = []
  let previousWinners = new Set<string>()
  let localeObserver: MutationObserver | null = null
  function syncVisitorControlLabels() {
    if (!options.visitorOverview?.value) return
    if (container.value) syncMapNavigationLabels(container.value, options.locale?.value ?? 'ja')
    const labels = [['Find my location', '現在地を表示'], ['Location not available', '現在地を取得できません'], ['Toggle attribution', '地図のクレジットを表示']]
    container.value?.querySelectorAll<HTMLElement>('.maplibregl-ctrl-geolocate, .maplibregl-ctrl-attrib-button').forEach(button => {
      for (const attribute of ['aria-label', 'title']) {
        const current = button.getAttribute(attribute)
        const pair = labels.find(pair => pair.includes(current ?? ''))
        const translated = pair?.[options.locale?.value === 'en' ? 0 : 1]
        if (translated && translated !== current) button.setAttribute(attribute, translated)
      }
    })
  }
  let detailCamera: (MapViewerCameraState & { bearing: number, pitch: number }) | null = null
  const discardDetailContext = () => { detailCamera = null }
  function captureDetailContext() {
    const instance = map.value
    if (!instance || detailCamera) return
    instance.stop()
    detailCamera = { ...getMapViewerCameraState(instance), bearing: instance.getBearing(), pitch: instance.getPitch() }
  }
  function restoreDetailContext() {
    const instance = map.value
    const saved = detailCamera
    detailCamera = null
    if (!instance || !saved) return
    instance.stop()
    instance.jumpTo({ ...saved, center: [saved.center.lng, saved.center.lat] })
    syncMarkerDensity()
  }
  const recovery = useMapCollisionRecovery({
    map: () => map.value, frame: () => container.value, candidates: () => collisionCandidates,
    spots: () => options.spots.value, position: spot => imageToRenderCoordinates(options.floor.value, spot),
    visitor: () => Boolean(options.visitorOverview?.value),
    onStarted: () => options.onCollisionStarted?.(),
    select: spot => options.onSpotSelected?.(spot), refresh: () => syncMarkerDensity(),
  })
  let comparisonBaseline: MapViewerCameraState | null = null

  const mapCamera = useMapCamera(container, map, {
    mode: options.mode,
    floor: options.floor,
    mobileCover: options.mobileCover,
    visitorOverview: options.visitorOverview,
    spots: options.initialSpots ?? options.spots,
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
    createBaseControls: () => [new MapNavigationControl(mapCamera.getHomePitch, options.mode === 'view' ? () => {
      if (options.visitorOverview?.value) options.onCollisionStarted?.()
      mapCamera.showWholeFloor()
    } : undefined, discardDetailContext, Boolean(options.visitorOverview?.value), () => options.locale?.value ?? 'ja')],
    createControlGroup: controls => {
      const group = new HorizontalMapControlGroup(controls)
      return {
        onAdd(instance: MapLibreMap) {
          const element = group.onAdd(instance)
          if (options.visitorOverview?.value) element.dataset.mapFitEdge = 'bottom'
          return element
        },
        onRemove: (instance: MapLibreMap) => group.onRemove(instance),
        getElement: () => group.getElement(),
      }
    },
    onExplicitRequest: () => { discardDetailContext(); locationCameraPolicy.beginRequest() },
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
      const instance = new maplibregl.Map(createMapViewerOptions(container.value, options.mode, Boolean(options.visitorOverview?.value), options.locale?.value))
      map.value = instance
      const controls = container.value.querySelector('.maplibregl-control-container')
      if (controls && options.visitorOverview?.value) {
        localeObserver = new MutationObserver(syncVisitorControlLabels)
        localeObserver.observe(controls, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-label', 'title'] })
      }
      container.value.addEventListener('keydown', recovery.onKey, true)
      instance.on('movestart', recovery.onMotion)
      instance.on('movestart', event => { if (event.originalEvent) discardDetailContext() })
      instance.on('click', () => recovery.close())
      container.value.addEventListener('focusin', syncMarkerDensity)
      container.value.addEventListener('focusout', syncMarkerDensity)
      instance.once('load', () => {
        if (map.value !== instance) return
        isReady.value = true
        syncGeolocateControl(options.floor.value)
        showFloor(options.floor.value, false)
        comparisonBaseline = mapCamera.getState()
        if (options.initialCamera) mapCamera.restore(options.initialCamera)
        syncSpotMarkers()
        instance.on('move', syncMarkerDensity)
        instance.on('resize', () => { recovery.close(); syncMarkerDensity() })
        instance.on('render', syncMarkerDensity)
        syncDraftMarker(options.position.value)
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
    localeObserver?.disconnect()
    localeObserver = null
    recovery.close()
    container.value?.removeEventListener('keydown', recovery.onKey, true)
    container.value?.removeEventListener('focusin', syncMarkerDensity)
    container.value?.removeEventListener('focusout', syncMarkerDensity)
    if (collisionFrame !== null) window.cancelAnimationFrame(collisionFrame)
    collisionFrame = null
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
    recovery.close()
    previousWinners.clear()
    collisionCandidates = []
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
      const element: HTMLElement = createSpotMarkerElement(spot, {
        mode: options.mode,
        visitor: options.visitorOverview?.value,
        selected: selected && !ghost,
        ghost,
        dimmed: selectedIsPositioned && !selected,
        stronglyDimmed: Boolean(candidateKind) && !selected,
        onSelected: () => {
          if (options.mode === 'view' && (!options.visitorOverview?.value || Number(element.dataset.collisionGroupSize) > 1)) recovery.activate(spot)
          else { if (options.mode === 'view') recovery.close(); options.onSpotSelected?.(spot) }
        },
      })
      element.querySelectorAll('img').forEach(image => image.addEventListener('load', syncMarkerDensity, { once: true }))
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
    if (collisionFrame !== null) return
    collisionFrame = window.requestAnimationFrame(() => {
      collisionFrame = null
      const instance = map.value
      if (!instance) return
      const presentations = spotMarkerElements.map(({ element, spot }) => {
        const presentation = getMarkerDensityPresentation(spot.importance, spot.pinSize ?? 'medium', instance.getZoom(), instance.getMinZoom(), options.mode === 'edit' || spot.id === options.selectedSpotId.value, options.prioritizeVisibleSpots?.value ?? false, options.visitorOverview?.value ?? false)
        if (element.contains(element.ownerDocument.activeElement)) presentation.visible = true
        if (options.mode === 'edit') applyMarkerDensityPresentation(element, presentation)
        else {
          element.hidden = false
          element.style.zIndex = String(presentation.priority)
          element.style.setProperty('--marker-size-scale', presentation.scale.toFixed(3))
        }
        return { element, spot, presentation }
      })
      if (options.mode === 'edit') return
      // All scale writes precede all geometry reads; visibility writes happen last.
      const frame = container.value!.getBoundingClientRect()
      collisionCandidates = presentations.map(({ element, spot, presentation }) => {
        const rect = options.visitorOverview?.value ? measurePinVisualRect(element) : measurePinRect(element)
        return { id: spot.id, priority: presentation.priority, protected: element.contains(element.ownerDocument.activeElement), rect,
          centerDistance: Math.hypot((rect.left+rect.right)/2-frame.left-frame.width/2,(rect.top+rect.bottom)/2-frame.top-frame.height/2) }
      })
      const eligible = new Set(presentations.filter(item => item.presentation.visible).map(item => item.spot.id))
      const gap = options.visitorOverview?.value ? VISITOR_PIN_COLLISION_GAP : undefined
      const visible = declutterPins(collisionCandidates.filter(pin => eligible.has(pin.id)), gap, previousWinners, frame)
      previousWinners = visible
      const groupSizes = getCollisionRepresentatives(collisionCandidates, visible, gap)
      presentations.forEach(({ element, spot }) => {
        // Spread clones are the visible, keyboard reachable representation while open.
        applyPinVisibility(element, recovery.isOpen() ? !recovery.hasMember(spot.id) && visible.has(spot.id) : visible.has(spot.id))
        element.dataset.collisionGroupSize = String(groupSizes.get(spot.id) ?? 1)
        const hasCollision = (groupSizes.get(spot.id) ?? 1) > 1
        const badge = element.querySelector<HTMLElement>('.map-viewer-marker__collision-badge')
        if (badge) {
          badge.hidden = !hasCollision
          const count = String(groupSizes.get(spot.id) ?? 1)
          if (badge.textContent !== count) badge.textContent = count
        }
        const collisionCount = options.visitorOverview?.value ? `（${groupSizes.get(spot.id)}件）` : ''
        element.setAttribute('aria-label', hasCollision ? `${spot.name}の周辺ピンを表示${collisionCount}` : `${spot.name}の詳細を表示`)
        if (hasCollision) element.setAttribute('aria-expanded', String(recovery.hasMember(spot.id)))
        else element.removeAttribute('aria-expanded')
      })
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
      44,
      options.visitorOverview?.value ? measureVisitorFitPadding(frame).top + 88 : 44,
    )
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return false
    // MapLibre panBy moves the camera center; the projected PIN moves in the
    // opposite screen direction from the requested camera offset.
    instance.panBy([-dx, -dy], { duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 250 })
    return true
  }

  function compareCamera(pitch: 0 | 20 | 25 | 45, fit: boolean) {
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
    floorImageState.value = 'idle'
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

  function showFloor(floor: MapViewerFloor, animate = true, refit = true) {
    const instance = map.value
    const corners = getFloorCorners(floor)
    if (!instance || !isReady.value) return false

    recovery.close()
    removeFloorImage()
    if (refit) {
      if (options.visitorOverview?.value) discardDetailContext()
      mapCamera.resetFloorCamera()
    }

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
    if (options.visitorOverview?.value) {
      const source = instance.getSource<ImageSource>(sourceId)!
      monitorFloorImage(source, () => map.value === instance && activeSourceId === sourceId && instance.getSource(sourceId) === source,
        state => { floorImageState.value = state })
    }
    syncDecorations()

    if (refit) mapCamera.fitFloorBounds(corners, animate)
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
  if (options.locale) watch(options.locale, syncVisitorControlLabels)
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
  if (options.prioritizeVisibleSpots) watch(() => options.prioritizeVisibleSpots?.value, () => { recovery.close(); previousWinners.clear(); syncMarkerDensity() })
  watchViewerFloorRendering(options.floor, () => Boolean(options.visitorOverview?.value), (floor, refit) => {
    if (!isReady.value) return
    if (refit) syncGeolocateControl(floor)
    showFloor(floor, true, refit)
    syncSpotMarkers()
    syncDraftMarker(options.position.value)
  })

  return {
    map: readonly(map),
    mapError: readonly(mapError),
    floorError: readonly(floorError),
    floorImageState: readonly(floorImageState),
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
    captureDetailContext,
    restoreDetailContext,
    discardDetailContext,
    compareCamera,
  }
}
