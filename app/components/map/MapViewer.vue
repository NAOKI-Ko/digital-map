<script setup lang="ts">
import { useMapViewer, type MapViewerMode } from '~/composables/useMapViewer'
import type { ImagePosition } from '~~/lib/geo'
import type { MapViewerCameraState, MapViewerDecoration, MapViewerFloor, MapViewerSpot } from '~~/shared/types/map-viewer'

const props = withDefaults(defineProps<{
  floor: MapViewerFloor
  spots?: readonly MapViewerSpot[]
  decorations?: readonly MapViewerDecoration[]
  mode?: MapViewerMode
  modelValue?: ImagePosition | null
  selectedSpotId?: string | null
  draggableSpotId?: string | null
  placementEnabled?: boolean
  height?: string
  label?: string
  floorErrorActionTo?: string | null
  initialCamera?: MapViewerCameraState | null
  prioritizeVisibleSpots?: boolean
}>(), {
  spots: () => [],
  decorations: () => [],
  mode: 'view',
  modelValue: null,
  selectedSpotId: null,
  draggableSpotId: null,
  placementEnabled: false,
  height: '38rem',
  label: 'デジタルマップ',
  floorErrorActionTo: null,
  initialCamera: null,
  prioritizeVisibleSpots: false,
})

const emit = defineEmits<{
  'update:modelValue': [position: ImagePosition]
  'spotMoved': [value: { spotId: string, x: number, y: number }]
  'spotSelected': [spot: MapViewerSpot]
  'cameraChanged': [camera: MapViewerCameraState]
}>()

const container = useTemplateRef<HTMLDivElement>('container')
const floor = toRef(props, 'floor')
const spots = toRef(props, 'spots')
const decorations = toRef(props, 'decorations')
const position = toRef(props, 'modelValue')
const selectedSpotId = toRef(props, 'selectedSpotId')
const draggableSpotId = toRef(props, 'draggableSpotId')
const placementEnabled = toRef(props, 'placementEnabled')
const prioritizeVisibleSpots = toRef(props, 'prioritizeVisibleSpots')
const { floorError, geolocationAreaMessage, mapError } = useMapViewer(container, {
  floor,
  spots,
  decorations,
  position,
  selectedSpotId,
  draggableSpotId,
  placementEnabled,
  prioritizeVisibleSpots,
  mode: props.mode,
  initialCamera: props.initialCamera,
  onCameraChanged: camera => emit('cameraChanged', camera),
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
        :class="mode === 'edit' && placementEnabled ? 'cursor-crosshair' : 'cursor-grab'"
        :style="{ height }"
        :aria-label="label"
        role="region"
        tabindex="0"
      />
      <div
        v-if="mode === 'edit' && placementEnabled"
        class="pointer-events-none absolute left-3 top-3 rounded-lg bg-white/95 px-4 py-3 text-sm font-semibold text-stone-800 shadow"
      >
        地図をクリックして仮配置
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
  position: relative;
  display: flex;
  width: 3.75rem;
  height: 3.75rem;
  align-items: flex-end;
  justify-content: center;
  border: 0;
  background: transparent;
  cursor: pointer;
  padding: 0;
  transition: opacity 120ms linear;
}

.map-viewer-marker--illustration {
  width: max-content;
  min-width: 2rem;
  height: 3rem;
}

.map-viewer-marker__ground-shadow {
  position: absolute;
  bottom: -0.25rem;
  left: 50%;
  width: 1.625rem;
  height: 0.5rem;
  border-radius: 50%;
  background: rgb(37 48 58 / 28%);
  filter: blur(2px);
  opacity: 1;
  pointer-events: none;
  transform: translateX(-50%);
  transition: opacity 120ms linear;
}

.map-viewer-marker--illustration .map-viewer-marker__ground-shadow {
  width: min(70%, 4rem);
}

.map-viewer-marker__shape {
  position: absolute;
  bottom: 0;
  left: 50%;
  z-index: 1;
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  border: 3px solid white;
  border-radius: 9999px 9999px 9999px 0;
  background-color: var(--pin-color);
  background-image: radial-gradient(
    circle at 32% 28%,
    var(--pin-color-light) 0%,
    var(--pin-color) 55%,
    var(--pin-color-dark) 100%
  );
  box-shadow:
    0 6px 10px rgb(37 48 58 / 35%),
    inset -3px -3px 6px rgb(0 0 0 / 25%),
    inset 2px 2px 4px rgb(255 255 255 / 35%);
  color: white;
  font-size: 0.75rem;
  font-weight: 800;
  transform-origin: bottom left;
  transform: rotate(-45deg);
  transition: scale 150ms ease, box-shadow 150ms ease, opacity 120ms linear;
  scale: var(--marker-size-scale, 1);
}

.map-viewer-marker__content {
  display: grid;
  width: 1.875rem;
  height: 1.875rem;
  place-items: center;
  border-radius: 9999px;
  background: white;
  color: #292524;
  font-size: 1rem;
  line-height: 1;
  object-fit: cover;
  object-position: center;
  transform: rotate(45deg);
}

.map-viewer-marker__content--material {
  font-size: 1.375rem;
  font-style: normal;
  font-variation-settings: 'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 20;
  font-weight: 400;
}

.map-viewer-marker__illustration {
  position: relative;
  z-index: 1;
  display: block;
  width: max-content;
  transform-origin: bottom center;
  filter: drop-shadow(0 5px 5px rgb(37 48 58 / 32%));
  transition: scale 150ms ease, filter 150ms ease, opacity 120ms linear;
  scale: var(--marker-size-scale, 1);
}

.map-viewer-marker__illustration-image {
  display: block;
  width: auto;
  height: 3rem;
  max-width: 10rem;
  object-fit: contain;
}

.map-viewer-marker--selected .map-viewer-marker__shape,
.map-viewer-marker:focus-visible .map-viewer-marker__shape {
  box-shadow:
    0 0 0 4px rgb(255 255 255 / 80%),
    0 7px 12px rgb(37 48 58 / 45%),
    inset -3px -3px 6px rgb(0 0 0 / 25%),
    inset 2px 2px 4px rgb(255 255 255 / 35%);
  scale: calc(var(--marker-size-scale, 1) * 1.12);
}

.map-viewer-marker--selected .map-viewer-marker__illustration,
.map-viewer-marker:focus-visible .map-viewer-marker__illustration {
  filter:
    drop-shadow(0 0 3px rgb(255 255 255 / 95%))
    drop-shadow(0 6px 6px rgb(37 48 58 / 42%));
  scale: calc(var(--marker-size-scale, 1) * 1.12);
}

.map-viewer-draft-marker {
  position: relative;
  display: flex;
  width: 5.5rem;
  height: 4.75rem;
  align-items: flex-end;
  justify-content: center;
  filter: drop-shadow(0 4px 5px rgb(37 48 58 / 30%));
}

.map-viewer-draft-marker__badge {
  position: absolute;
  top: 0;
  left: 50%;
  z-index: 2;
  transform: translateX(-50%);
  white-space: nowrap;
  border-radius: 9999px;
  background: #1c1917;
  padding: 0.2rem 0.55rem;
  color: white;
  font-size: 0.6875rem;
  font-weight: 700;
}

.map-viewer-draft-marker__pin {
  width: 2.75rem;
  height: 2.75rem;
  border: 4px solid white;
  border-radius: 9999px 9999px 9999px 0;
  background: #c7401f;
  box-shadow: 0 0 0 4px rgb(28 25 23 / 72%);
  transform: rotate(-45deg);
}

.map-viewer-current-location-marker {
  width: 1.25rem;
  height: 1.25rem;
  border: 3px solid white;
  border-radius: 9999px;
  background: #2563eb;
  box-shadow: 0 0 0 0.3rem rgb(37 99 235 / 25%), 0 2px 8px rgb(0 0 0 / 35%);
}

.map-viewer-control-group {
  display: flex;
  gap: 0.5rem;
  margin: 0.75rem 0.75rem 0 0;
}

.maplibregl-ctrl-top-right .map-viewer-control-group > .maplibregl-ctrl {
  margin: 0;
}

.map-viewer-navigation-control {
  display: flex;
  overflow: hidden;
  border-radius: 0.75rem;
  background: white;
  box-shadow: 0 1px 4px rgb(0 0 0 / 30%);
}

.map-viewer-navigation-control button,
.map-viewer-control-group .maplibregl-ctrl-geolocate {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
}

.map-viewer-navigation-control button + button {
  border-left: 1px solid #e7e5e4;
}

.map-viewer-navigation-control button:focus-visible,
.map-viewer-control-group .maplibregl-ctrl-geolocate:focus-visible {
  position: relative;
  z-index: 1;
  outline: 2px solid #1c1917;
  outline-offset: -2px;
}
</style>
