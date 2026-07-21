<script setup lang="ts">
import 'maplibre-gl/dist/maplibre-gl.css'
import type {
  GeoJSONSource,
  ImageSource,
  Map as MapLibreMap,
  MapMouseEvent,
  MapTouchEvent,
  Marker,
} from 'maplibre-gl'
import {
  createDefaultGeoReferenceRectangle,
  getGeoReferenceBounds,
  getRectangleCorners,
  moveGeoReferenceRectangle,
  normalizeLongitude,
  resizeGeoReferenceRectangle,
  toImageCoordinates,
  type GeoReferenceCorner,
  type GeoReferenceRectangle,
  type LatLng,
} from '~~/lib/geo'

const props = defineProps<{
  illustrationUrl: string
  initialRectangle: GeoReferenceRectangle | null
}>()

const rectangle = defineModel<GeoReferenceRectangle | null>({ required: true })
const container = useTemplateRef<HTMLDivElement>('container')
const mapError = ref('')
let map: MapLibreMap | undefined
let maplibre: typeof import('maplibre-gl') | undefined
let markers: Marker[] = []
let dragState: { pointer: LatLng, rectangle: GeoReferenceRectangle } | null = null
let shouldResizeOnFirstSearch = props.initialRectangle === null

const IMAGE_SOURCE_ID = 'floor-illustration'
const IMAGE_LAYER_ID = 'floor-illustration-layer'
const RECTANGLE_SOURCE_ID = 'georeference-rectangle'
const RECTANGLE_FILL_LAYER_ID = 'georeference-rectangle-fill'
const RECTANGLE_LINE_LAYER_ID = 'georeference-rectangle-line'

const corners = [
  { key: 'topLeft', label: '左上' },
  { key: 'topRight', label: '右上' },
  { key: 'bottomRight', label: '右下' },
  { key: 'bottomLeft', label: '左下' },
] as const satisfies readonly { key: GeoReferenceCorner, label: string }[]

onMounted(async () => {
  if (!container.value) return

  try {
    const maplibregl = await import('maplibre-gl')
    maplibre = maplibregl
    rectangle.value = props.initialRectangle
    const bounds = rectangle.value ? getGeoReferenceBounds(rectangle.value) : null
    map = new maplibregl.Map({
      container: container.value,
      style: {
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
      },
      ...(bounds
        ? { bounds: [bounds.southwest, bounds.northeast], fitBoundsOptions: { padding: 96, maxZoom: 18 } }
        : { center: [138, 36], zoom: 5 }),
      renderWorldCopies: false,
      maxPitch: 0,
      dragRotate: false,
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.on('load', async () => {
      if (!rectangle.value && map) {
        rectangle.value = createDefaultRectangleFromMap(map)
        await nextTick()
      }
      safelyRenderRectangle()
      bindRectangleDragging()
    })
  }
  catch (error) {
    console.error('GeoReferenceEditorの初期化に失敗しました。', error)
    mapError.value = '地図を初期化できませんでした。WebGLが有効か確認してください。'
  }
})

onBeforeUnmount(() => {
  markers.forEach(marker => marker.remove())
  markers = []
  map?.remove()
  map = undefined
  maplibre = undefined
})

watch(rectangle, async () => {
  await nextTick()
  if (map?.isStyleLoaded() && !map.getSource(IMAGE_SOURCE_ID)) {
    safelyRenderRectangle()
    return
  }
  updateVisuals(rectangle.value)
}, { deep: true })

function createDefaultRectangleFromMap(currentMap: MapLibreMap) {
  const bounds = currentMap.getBounds()
  return createDefaultGeoReferenceRectangle({
    southwest: { lat: bounds.getSouth(), lng: bounds.getWest() },
    northeast: { lat: bounds.getNorth(), lng: bounds.getEast() },
  })
}

function setRectangle(value: GeoReferenceRectangle) {
  rectangle.value = value
  updateVisuals(value)
}

function rectangleGeoJson(value: GeoReferenceRectangle) {
  const cornersByName = getRectangleCorners(value)
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'Polygon' as const,
      coordinates: [[
        [cornersByName.topLeft.lng, cornersByName.topLeft.lat],
        [cornersByName.topRight.lng, cornersByName.topRight.lat],
        [cornersByName.bottomRight.lng, cornersByName.bottomRight.lat],
        [cornersByName.bottomLeft.lng, cornersByName.bottomLeft.lat],
        [cornersByName.topLeft.lng, cornersByName.topLeft.lat],
      ]],
    },
  }
}

function safelyRenderRectangle() {
  try {
    addRectangleLayersAndMarkers()
    mapError.value = ''
  }
  catch (error) {
    console.error('GeoReferenceEditorの矩形描画に失敗しました。', error)
    mapError.value = 'イラストを配置できませんでした。地図を読み込み直して再度お試しください。'
  }
}

function addRectangleLayersAndMarkers() {
  if (!map || !maplibre || !rectangle.value) return
  const currentRectangle = rectangle.value

  if (!map.getSource(IMAGE_SOURCE_ID)) {
    map.addSource(IMAGE_SOURCE_ID, {
      type: 'image',
      url: props.illustrationUrl,
      coordinates: toImageCoordinates(currentRectangle),
    })
    map.addLayer({
      id: IMAGE_LAYER_ID,
      type: 'raster',
      source: IMAGE_SOURCE_ID,
      paint: { 'raster-opacity': 0.55 },
    })
  }

  if (!map.getSource(RECTANGLE_SOURCE_ID)) {
    map.addSource(RECTANGLE_SOURCE_ID, {
      type: 'geojson',
      data: rectangleGeoJson(currentRectangle),
    })
    map.addLayer({
      id: RECTANGLE_FILL_LAYER_ID,
      type: 'fill',
      source: RECTANGLE_SOURCE_ID,
      paint: { 'fill-color': '#dc2626', 'fill-opacity': 0.1 },
    })
    map.addLayer({
      id: RECTANGLE_LINE_LAYER_ID,
      type: 'line',
      source: RECTANGLE_SOURCE_ID,
      paint: { 'line-color': '#dc2626', 'line-width': 4 },
    })
  }

  markers.forEach(marker => marker.remove())
  markers = corners.map((corner) => {
    const element = document.createElement('button')
    element.type = 'button'
    element.className = 'geo-resize-handle'
    element.setAttribute('aria-label', `${corner.label}をドラッグして矩形をリサイズ`)
    element.title = `${corner.label}をドラッグしてリサイズ`
    element.addEventListener('mousedown', event => event.stopPropagation())
    element.addEventListener('touchstart', event => event.stopPropagation(), { passive: true })
    const position = getRectangleCorners(currentRectangle)[corner.key]
    const marker = new maplibre!.Marker({ element, draggable: true })
      .setLngLat([position.lng, position.lat])
      .addTo(map!)

    marker.on('drag', () => {
      if (!rectangle.value) return
      const lngLat = marker.getLngLat()
      setRectangle(resizeGeoReferenceRectangle(rectangle.value, corner.key, {
        lat: lngLat.lat,
        lng: normalizeLongitude(lngLat.lng),
      }))
    })
    marker.on('dragend', () => updateVisuals())
    return marker
  })
}

function updateVisuals(value: GeoReferenceRectangle | null = rectangle.value) {
  if (!map || !value || !map.isStyleLoaded()) return
  const currentRectangle = value
  const imageSource = map.getSource(IMAGE_SOURCE_ID) as ImageSource | undefined
  imageSource?.setCoordinates(toImageCoordinates(currentRectangle))
  const rectangleSource = map.getSource(RECTANGLE_SOURCE_ID) as GeoJSONSource | undefined
  rectangleSource?.setData(rectangleGeoJson(currentRectangle))

  const positions = getRectangleCorners(currentRectangle)
  corners.forEach((corner, index) => {
    const position = positions[corner.key]
    markers[index]?.setLngLat([position.lng, position.lat])
  })
}

function bindRectangleDragging() {
  if (!map) return
  map.on('mouseenter', RECTANGLE_FILL_LAYER_ID, () => {
    if (map) map.getCanvas().style.cursor = 'move'
  })
  map.on('mouseleave', RECTANGLE_FILL_LAYER_ID, () => {
    if (map && !dragState) map.getCanvas().style.cursor = ''
  })
  map.on('mousedown', RECTANGLE_FILL_LAYER_ID, startRectangleMouseDrag)
  map.on('touchstart', RECTANGLE_FILL_LAYER_ID, startRectangleTouchDrag)
}

function startRectangleMouseDrag(event: MapMouseEvent) {
  startRectangleDrag(event.lngLat)
  map?.on('mousemove', continueRectangleMouseDrag)
  map?.once('mouseup', finishRectangleMouseDrag)
}

function continueRectangleMouseDrag(event: MapMouseEvent) {
  continueRectangleDrag(event.lngLat)
}

function finishRectangleMouseDrag() {
  map?.off('mousemove', continueRectangleMouseDrag)
  finishRectangleDrag()
}

function startRectangleTouchDrag(event: MapTouchEvent) {
  startRectangleDrag(event.lngLat)
  map?.on('touchmove', continueRectangleTouchDrag)
  map?.once('touchend', finishRectangleTouchDrag)
}

function continueRectangleTouchDrag(event: MapTouchEvent) {
  continueRectangleDrag(event.lngLat)
}

function finishRectangleTouchDrag() {
  map?.off('touchmove', continueRectangleTouchDrag)
  finishRectangleDrag()
}

function startRectangleDrag(position: { lat: number, lng: number }) {
  if (!map || !rectangle.value) return
  dragState = {
    pointer: { lat: position.lat, lng: normalizeLongitude(position.lng) },
    rectangle: {
      topLeft: { ...rectangle.value.topLeft },
      bottomRight: { ...rectangle.value.bottomRight },
    },
  }
  map.dragPan.disable()
  map.getCanvas().style.cursor = 'grabbing'
}

function continueRectangleDrag(position: { lat: number, lng: number }) {
  if (!dragState) return
  const current = { lat: position.lat, lng: normalizeLongitude(position.lng) }
  setRectangle(moveGeoReferenceRectangle(dragState.rectangle, {
    lat: current.lat - dragState.pointer.lat,
    lng: current.lng - dragState.pointer.lng,
  }))
}

function finishRectangleDrag() {
  dragState = null
  map?.dragPan.enable()
  if (map) map.getCanvas().style.cursor = 'move'
}

function focusLocation(position: LatLng) {
  if (!map) return
  const currentMap = map
  currentMap.easeTo({
    center: [normalizeLongitude(position.lng), position.lat],
    zoom: Math.max(currentMap.getZoom(), 14),
    duration: 600,
  })
  currentMap.once('moveend', () => {
    const current = rectangle.value
    if (current && !shouldResizeOnFirstSearch) {
      const center = {
        lat: (current.topLeft.lat + current.bottomRight.lat) / 2,
        lng: (current.topLeft.lng + current.bottomRight.lng) / 2,
      }
      setRectangle(moveGeoReferenceRectangle(current, {
        lat: position.lat - center.lat,
        lng: normalizeLongitude(position.lng) - center.lng,
      }))
    }
    else {
      setRectangle(createDefaultRectangleFromMap(currentMap))
      shouldResizeOnFirstSearch = false
    }
  })
}

defineExpose({ focusLocation })
</script>

<template>
  <div>
    <div class="relative overflow-hidden rounded-xl border border-stone-300 bg-stone-100">
      <div ref="container" class="h-[34rem] w-full" aria-label="ジオリファレンス設定地図" />
      <div class="pointer-events-none absolute left-3 top-3 max-w-xs rounded-lg bg-white/95 px-4 py-3 text-xs leading-5 text-stone-700 shadow">
        赤い矩形の内側をドラッグして移動し、四隅の丸いハンドルで大きさを調整してください。回転はできません。
      </div>
    </div>
    <p v-if="mapError" role="alert" class="mt-3 text-sm text-red-600">{{ mapError }}</p>

    <dl v-if="rectangle" class="mt-4 grid gap-3 sm:grid-cols-2">
      <div class="rounded-lg bg-stone-100 p-3 text-xs">
        <dt class="font-semibold text-stone-700">左上</dt>
        <dd class="mt-1 font-mono text-stone-600">lat {{ rectangle.topLeft.lat.toFixed(6) }}</dd>
        <dd class="font-mono text-stone-600">lng {{ rectangle.topLeft.lng.toFixed(6) }}</dd>
      </div>
      <div class="rounded-lg bg-stone-100 p-3 text-xs">
        <dt class="font-semibold text-stone-700">右下</dt>
        <dd class="mt-1 font-mono text-stone-600">lat {{ rectangle.bottomRight.lat.toFixed(6) }}</dd>
        <dd class="font-mono text-stone-600">lng {{ rectangle.bottomRight.lng.toFixed(6) }}</dd>
      </div>
    </dl>
  </div>
</template>

<style>
.geo-resize-handle {
  width: 1.5rem;
  height: 1.5rem;
  border: 3px solid white;
  border-radius: 9999px;
  background: #dc2626;
  box-shadow: 0 2px 8px rgb(0 0 0 / 35%);
  cursor: nwse-resize;
}

.geo-resize-handle:active {
  cursor: grabbing;
}
</style>
