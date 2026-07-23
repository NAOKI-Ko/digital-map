<script setup lang="ts">
import { useMapViewer, type MapViewerMode } from '~/composables/useMapViewer'
import type { LatLng } from '~~/lib/geo'
import type { MapViewerFloor, MapViewerSpot } from '~~/shared/types/map-viewer'

const props = withDefaults(defineProps<{
  floor: MapViewerFloor
  spots?: readonly MapViewerSpot[]
  mode?: MapViewerMode
  modelValue?: LatLng | null
  selectedSpotId?: string | null
  height?: string
  label?: string
  floorErrorActionTo?: string | null
}>(), {
  spots: () => [],
  mode: 'view',
  modelValue: null,
  selectedSpotId: null,
  height: '38rem',
  label: 'デジタルマップ',
  floorErrorActionTo: null,
})

const emit = defineEmits<{
  'update:modelValue': [position: LatLng]
  'spotMoved': [value: { spotId: string, lat: number, lng: number }]
  'spotSelected': [spot: MapViewerSpot]
}>()

const container = useTemplateRef<HTMLDivElement>('container')
const floor = toRef(props, 'floor')
const spots = toRef(props, 'spots')
const position = toRef(props, 'modelValue')
const selectedSpotId = toRef(props, 'selectedSpotId')
const { floorError, geolocationAreaMessage, geolocationAvailable, mapError } = useMapViewer(container, {
  floor,
  spots,
  position,
  selectedSpotId,
  mode: props.mode,
  onPositionChanged: value => emit('update:modelValue', value),
  onSpotMoved: value => emit('spotMoved', value),
  onSpotSelected: spot => emit('spotSelected', spot),
})
</script>

<template>
  <div>
    <div class="relative overflow-hidden rounded-xl border border-stone-300 bg-stone-100">
      <div
        ref="container"
        class="w-full"
        :class="mode === 'edit' ? 'cursor-crosshair' : 'cursor-grab'"
        :style="{ height }"
        :aria-label="label"
      />
      <div
        v-if="mode === 'edit'"
        class="pointer-events-none absolute left-3 top-3 rounded-lg bg-white/95 px-4 py-3 text-sm font-semibold text-stone-800 shadow"
      >
        地図をクリックしてピンを置く
      </div>
      <div
        v-if="floorError"
        class="absolute inset-x-4 top-1/2 mx-auto max-w-md -translate-y-1/2 rounded-xl bg-white/95 p-5 text-center text-sm font-semibold text-stone-700 shadow-lg"
        :class="{ 'pointer-events-none': !floorErrorActionTo }"
      >
        <p>{{ floorError }}</p>
        <NuxtLink v-if="floorErrorActionTo" :to="floorErrorActionTo" class="mt-4 inline-flex rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-semibold text-white hover:bg-terracotta-700">ジオリファレンスを設定</NuxtLink>
      </div>
      <p
        v-if="geolocationAvailable"
        class="pointer-events-none absolute bottom-3 left-3 max-w-xs rounded-lg bg-white/90 px-3 py-2 text-xs leading-5 text-stone-600 shadow"
      >
        現在地はイラスト上のおおよその目安です。
      </p>
      <p
        v-if="geolocationAreaMessage"
        role="status"
        class="pointer-events-none absolute inset-x-4 top-4 mx-auto max-w-md rounded-lg bg-amber-50/95 px-4 py-3 text-center text-sm font-semibold text-amber-900 shadow"
      >
        {{ geolocationAreaMessage }}
      </p>
    </div>
    <p v-if="mapError" role="alert" class="mt-3 text-sm text-red-600">
      {{ mapError }}
    </p>
  </div>
</template>

<style>
.map-viewer-marker {
  width: 2.75rem;
  height: 3.25rem;
  border: 0;
  background: transparent;
  cursor: pointer;
  padding: 0;
}

.map-viewer-marker__shape {
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
  transition: scale 150ms ease, box-shadow 150ms ease;
}

.map-viewer-marker__content {
  width: 1.55rem;
  height: 1.55rem;
  object-fit: cover;
  transform: rotate(45deg);
}

.map-viewer-marker--selected .map-viewer-marker__shape,
.map-viewer-marker:focus-visible .map-viewer-marker__shape {
  box-shadow: 0 0 0 4px rgb(255 255 255 / 80%), 0 3px 12px rgb(0 0 0 / 45%);
  scale: 1.12;
}

.map-viewer-current-location-marker {
  width: 1.25rem;
  height: 1.25rem;
  border: 3px solid white;
  border-radius: 9999px;
  background: #2563eb;
  box-shadow: 0 0 0 0.3rem rgb(37 99 235 / 25%), 0 2px 8px rgb(0 0 0 / 35%);
}
</style>
