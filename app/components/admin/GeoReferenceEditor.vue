<script setup lang="ts">
import 'maplibre-gl/dist/maplibre-gl.css'
import type { ImageSource, Map as MapLibreMap, Marker } from 'maplibre-gl'
import {
  createGeoReferenceFromBounds,
  getGeoReferenceBounds,
  toImageCoordinates,
  type GeoReferenceCoordinates,
  type LatLng,
} from '~~/lib/geo'

const props = defineProps<{
  illustrationUrl: string
  initialCoordinates: GeoReferenceCoordinates | null
}>()

const coordinates = defineModel<GeoReferenceCoordinates | null>({ required: true })
const container = useTemplateRef<HTMLDivElement>('container')
const mapError = ref('')
let map: MapLibreMap | undefined
let maplibre: typeof import('maplibre-gl') | undefined
let markers: Marker[] = []

const corners = [
  { key: 'topLeft', label: '左上' },
  { key: 'topRight', label: '右上' },
  { key: 'bottomRight', label: '右下' },
  { key: 'bottomLeft', label: '左下' },
] as const

onMounted(async () => {
  if (!container.value) return

  try {
    const maplibregl = await import('maplibre-gl')
    maplibre = maplibregl
    coordinates.value = props.initialCoordinates
    const bounds = coordinates.value ? getGeoReferenceBounds(coordinates.value) : null
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
        ? { bounds: [bounds.southwest, bounds.northeast], fitBoundsOptions: { padding: 80, maxZoom: 18 } }
        : { center: [0, 0], zoom: 1 }),
      maxPitch: 0,
      dragRotate: false,
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    map.on('load', () => {
      addIllustrationAndMarkers()
    })
  }
  catch {
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

function setCorner(key: keyof GeoReferenceCoordinates, value: LatLng) {
  if (!coordinates.value) return
  coordinates.value = {
    ...coordinates.value,
    [key]: value,
  }

  const source = map?.getSource('floor-illustration') as ImageSource | undefined
  source?.setCoordinates(toImageCoordinates(coordinates.value))
}

function initializeFromViewport() {
  if (!map) return
  const bounds = map.getBounds()
  coordinates.value = createGeoReferenceFromBounds({
    southwest: { lat: bounds.getSouth(), lng: bounds.getWest() },
    northeast: { lat: bounds.getNorth(), lng: bounds.getEast() },
  })
  addIllustrationAndMarkers()
}

function addIllustrationAndMarkers() {
  if (!map || !maplibre || !coordinates.value) return
  const currentMap = map
  const currentMaplibre = maplibre
  const currentCoordinates = coordinates.value

  if (!currentMap.getSource('floor-illustration')) {
    currentMap.addSource('floor-illustration', {
      type: 'image',
      url: props.illustrationUrl,
      coordinates: toImageCoordinates(currentCoordinates),
    })
    currentMap.addLayer({
      id: 'floor-illustration',
      type: 'raster',
      source: 'floor-illustration',
      paint: { 'raster-opacity': 0.72 },
    })
  }

  markers.forEach(marker => marker.remove())
  markers = corners.map((corner) => {
    const element = document.createElement('button')
    element.type = 'button'
    element.className = 'geo-corner-marker'
    element.textContent = corner.label
    element.title = `${corner.label}をドラッグ`
    const position = currentCoordinates[corner.key]
    const marker = new currentMaplibre.Marker({ element, draggable: true })
      .setLngLat([position.lng, position.lat])
      .addTo(currentMap)

    marker.on('drag', () => {
      const lngLat = marker.getLngLat()
      setCorner(corner.key, { lat: lngLat.lat, lng: lngLat.lng })
    })
    return marker
  })
}
</script>

<template>
  <div>
    <div class="relative overflow-hidden rounded-xl border border-stone-300 bg-stone-100">
      <div ref="container" class="h-[34rem] w-full" aria-label="ジオリファレンス設定地図" />
      <div v-if="coordinates" class="pointer-events-none absolute left-3 top-3 max-w-xs rounded-lg bg-white/95 px-4 py-3 text-xs leading-5 text-stone-700 shadow">
        色付きの「左上・右上・右下・左下」をドラッグし、イラストの四隅を地図上の位置に合わせてください。
      </div>
      <div v-else class="absolute inset-x-4 top-1/2 mx-auto max-w-sm -translate-y-1/2 rounded-xl bg-white/95 p-5 text-center shadow-lg">
        <p class="text-sm font-semibold text-stone-900">四隅の座標は未設定です</p>
        <p class="mt-2 text-xs leading-5 text-stone-600">地図を対象地域まで移動・拡大し、現在の表示範囲へイラストを配置してください。</p>
        <button type="button" class="mt-4 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-semibold text-white" @click="initializeFromViewport">現在の表示範囲に配置</button>
      </div>
    </div>
    <p v-if="mapError" role="alert" class="mt-3 text-sm text-red-600">{{ mapError }}</p>

    <dl v-if="coordinates" class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div v-for="corner in corners" :key="corner.key" class="rounded-lg bg-stone-100 p-3 text-xs">
        <dt class="font-semibold text-stone-700">{{ corner.label }}</dt>
        <dd class="mt-1 font-mono text-stone-600">lat {{ coordinates[corner.key].lat.toFixed(6) }}</dd>
        <dd class="font-mono text-stone-600">lng {{ coordinates[corner.key].lng.toFixed(6) }}</dd>
      </div>
    </dl>
  </div>
</template>

<style>
.geo-corner-marker {
  width: 2.75rem;
  height: 2.75rem;
  border: 3px solid white;
  border-radius: 9999px;
  background: #c7401f;
  box-shadow: 0 2px 8px rgb(0 0 0 / 35%);
  color: white;
  cursor: grab;
  font-size: 0.7rem;
  font-weight: 700;
}

.geo-corner-marker:active {
  cursor: grabbing;
}
</style>
