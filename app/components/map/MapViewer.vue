<script setup lang="ts">
import { useMapViewer, type MapViewerMode } from '~/composables/useMapViewer'
import type { MapViewerFloor } from '~~/shared/types/map-viewer'

const props = withDefaults(defineProps<{
  floor: MapViewerFloor
  mode?: MapViewerMode
  height?: string
  label?: string
}>(), {
  mode: 'view',
  height: '38rem',
  label: 'デジタルマップ',
})

const container = useTemplateRef<HTMLDivElement>('container')
const floor = toRef(props, 'floor')
const { floorError, mapError } = useMapViewer(container, { floor, mode: props.mode })
</script>

<template>
  <div>
    <div class="relative overflow-hidden rounded-xl border border-stone-300 bg-stone-100">
      <div
        ref="container"
        class="w-full"
        :style="{ height }"
        :aria-label="label"
      />
      <div
        v-if="floorError"
        class="pointer-events-none absolute inset-x-4 top-1/2 mx-auto max-w-md -translate-y-1/2 rounded-xl bg-white/95 p-5 text-center text-sm font-semibold text-stone-700 shadow-lg"
      >
        {{ floorError }}
      </div>
    </div>
    <p v-if="mapError" role="alert" class="mt-3 text-sm text-red-600">
      {{ mapError }}
    </p>
  </div>
</template>
