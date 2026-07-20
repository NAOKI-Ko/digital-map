<script setup lang="ts">
import { useMapViewer, type MapViewerMode } from '~/composables/useMapViewer'

const props = withDefaults(defineProps<{
  mode?: MapViewerMode
  height?: string
  label?: string
}>(), {
  mode: 'view',
  height: '38rem',
  label: 'デジタルマップ',
})

const container = useTemplateRef<HTMLDivElement>('container')
const { mapError } = useMapViewer(container, { mode: props.mode })
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
    </div>
    <p v-if="mapError" role="alert" class="mt-3 text-sm text-red-600">
      {{ mapError }}
    </p>
  </div>
</template>
