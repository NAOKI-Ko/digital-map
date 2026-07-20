<script setup lang="ts">
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Map as MapLibreMap, Marker } from 'maplibre-gl'
import { getGeoReferenceBounds, getLatLngBounds, toImageCoordinates, type GeoReferenceCoordinates, type LatLng } from '~~/lib/geo'
import type { MapFloorItem } from '~~/shared/types/floor'
import type { PositionedAdminSpotSummary } from '~~/shared/types/spot'
import { defaultPinIconId, getPinIconPreset } from '~~/shared/constants/spot'

const props = defineProps<{
  floor: MapFloorItem
  spots: PositionedAdminSpotSummary[]
}>()

const emit = defineEmits<{
  spotMoved: [value: { spotId: string, lat: number, lng: number }]
}>()

const position = defineModel<LatLng | null>({ required: true })
const container = useTemplateRef<HTMLDivElement>('container')
const mapError = ref('')
let map: MapLibreMap | undefined
let draftMarker: Marker | undefined
let spotMarkers: Marker[] = []

onMounted(async () => {
  if (!container.value) return

  try {
    const maplibregl = await import('maplibre-gl')
    const geoReference = getFloorGeoReference(props.floor)
    const bounds = geoReference
      ? getGeoReferenceBounds(geoReference)
      : getLatLngBounds(props.spots.map(spot => ({ lat: spot.lat, lng: spot.lng })))
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
        ? { bounds: [bounds.southwest, bounds.northeast], fitBoundsOptions: { padding: 70, maxZoom: 18 } }
        : { center: [0, 0], zoom: 1 }),
      maxPitch: 0,
      dragRotate: false,
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    map.on('load', () => {
      if (!map) return
      if (geoReference) {
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
      }

      spotMarkers = props.spots.map((spot) => {
        const element = document.createElement('button')
        element.type = 'button'
        element.className = 'existing-spot-marker'
        element.style.setProperty('--pin-color', spot.pinColor)
        element.setAttribute('aria-label', `${spot.name}をドラッグして位置調整`)
        element.title = `${spot.name}をドラッグして位置調整`
        const shape = document.createElement('span')
        shape.className = 'existing-spot-marker__shape'
        const content = document.createElement(spot.pinIconType === 'custom' && spot.pinIconImageUrl ? 'img' : 'span')
        content.className = 'existing-spot-marker__content'
        if (content instanceof HTMLImageElement && spot.pinIconImageUrl) {
          content.src = spot.pinIconImageUrl
          content.alt = ''
        }
        else {
          content.textContent = getPinIconPreset(spot.pinIconId ?? defaultPinIconId(spot.category)).symbol
        }
        shape.append(content)
        element.append(shape)
        element.addEventListener('click', event => event.stopPropagation())
        const marker = new maplibregl.Marker({ element, draggable: true })
          .setLngLat([spot.lng, spot.lat])
          .addTo(map!)
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat()
          emit('spotMoved', { spotId: spot.id, lat: lngLat.lat, lng: lngLat.lng })
        })
        return marker
      })
    })

    map.on('click', (event) => {
      if ((event.originalEvent.target as HTMLElement | null)?.closest('.existing-spot-marker')) return
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
  spotMarkers.forEach(marker => marker.remove())
  spotMarkers = []
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

<style>
.existing-spot-marker {
  width: 2.75rem;
  height: 3.25rem;
  border: 0;
  background: transparent;
  cursor: grab;
  padding: 0;
}

.existing-spot-marker__shape {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  border: 3px solid white;
  border-radius: 9999px 9999px 9999px 0;
  background: var(--pin-color);
  box-shadow: 0 2px 8px rgb(0 0 0 / 35%);
  color: white;
  font-size: 0.75rem;
  font-weight: 800;
  transform: rotate(-45deg);
}

.existing-spot-marker__content {
  width: 1.55rem;
  height: 1.55rem;
  object-fit: cover;
  transform: rotate(45deg);
}

.existing-spot-marker:active {
  cursor: grabbing;
}
</style>
