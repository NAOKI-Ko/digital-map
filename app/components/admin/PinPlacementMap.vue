<script setup lang="ts">
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Map as MapLibreMap, Marker } from 'maplibre-gl'
import { createDefaultGeoReference, getGeoReferenceBounds, toImageCoordinates, type GeoReferenceCoordinates, type LatLng } from '~~/lib/geo'
import type { MapFloorItem } from '~~/shared/types/floor'

const props = defineProps<{
  floor: MapFloorItem
}>()

const position = defineModel<LatLng | null>({ required: true })
const container = useTemplateRef<HTMLDivElement>('container')
const mapError = ref('')
let map: MapLibreMap | undefined
let draftMarker: Marker | undefined

onMounted(async () => {
  if (!container.value) return

  try {
    const maplibregl = await import('maplibre-gl')
    const geoReference = getFloorGeoReference(props.floor)
    const initialReference = geoReference ?? createDefaultGeoReference()
    const bounds = getGeoReferenceBounds(initialReference)
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
      bounds: [bounds.southwest, bounds.northeast],
      fitBoundsOptions: { padding: 70, maxZoom: 18 },
      maxPitch: 0,
      dragRotate: false,
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    map.on('load', () => {
      if (!map || !geoReference) return
      map.addSource('floor-illustration', {
        type: 'image',
        url: props.floor.illustrationUrl,
        coordinates: toImageCoordinates(geoReference),
      })
      map.addLayer({
        id: 'floor-illustration',
        type: 'raster',
        source: 'floor-illustration',
        paint: { 'raster-opacity': 0.82 },
      })
    })

    map.on('click', (event) => {
      position.value = { lat: event.lngLat.lat, lng: event.lngLat.lng }
      if (!map) return
      if (!draftMarker) {
        draftMarker = new maplibregl.Marker({ color: '#C7401F' }).addTo(map)
      }
      draftMarker.setLngLat([event.lngLat.lng, event.lngLat.lat])
    })

    if (position.value) {
      draftMarker = new maplibregl.Marker({ color: '#C7401F' })
        .setLngLat([position.value.lng, position.value.lat])
        .addTo(map)
    }
  }
  catch {
    mapError.value = '地図を初期化できませんでした。WebGLが有効か確認してください。'
  }
})

onBeforeUnmount(() => {
  draftMarker?.remove()
  map?.remove()
  draftMarker = undefined
  map = undefined
})

function getFloorGeoReference(floor: MapFloorItem): GeoReferenceCoordinates | null {
  if (
    floor.topLeftLat === null || floor.topLeftLng === null
    || floor.topRightLat === null || floor.topRightLng === null
    || floor.bottomRightLat === null || floor.bottomRightLng === null
    || floor.bottomLeftLat === null || floor.bottomLeftLng === null
  ) return null

  return {
    topLeft: { lat: floor.topLeftLat, lng: floor.topLeftLng },
    topRight: { lat: floor.topRightLat, lng: floor.topRightLng },
    bottomRight: { lat: floor.bottomRightLat, lng: floor.bottomRightLng },
    bottomLeft: { lat: floor.bottomLeftLat, lng: floor.bottomLeftLng },
  }
}
</script>

<template>
  <div>
    <div class="relative overflow-hidden rounded-xl border border-stone-300 bg-stone-100">
      <div ref="container" class="h-[38rem] w-full cursor-crosshair" aria-label="ピン配置地図" />
      <div class="pointer-events-none absolute left-3 top-3 rounded-lg bg-white/95 px-4 py-3 text-sm font-semibold text-stone-800 shadow">地図をクリックしてピンを置く</div>
    </div>
    <p v-if="mapError" role="alert" class="mt-3 text-sm text-red-600">{{ mapError }}</p>
  </div>
</template>
