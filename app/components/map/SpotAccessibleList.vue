<script setup lang="ts">
import type { MapViewerSpot } from '~~/shared/types/map-viewer'
defineProps<{ spots: readonly MapViewerSpot[], selectedSpotId?: string | null }>()
defineEmits<{ select: [spot: MapViewerSpot] }>()
</script>

<template>
  <details class="absolute left-3 top-16 z-30 max-h-[60svh] w-64 overflow-y-auto rounded-xl border border-stone-200 bg-white/95 shadow-lg sm:left-5">
    <summary class="cursor-pointer rounded-xl px-4 py-3 text-sm font-bold text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900">Spot一覧から選ぶ（{{ spots.length }}件）</summary>
    <p v-if="!spots.length" class="px-4 pb-4 text-sm text-stone-600">条件に一致するSpotはありません。</p>
    <ul v-else class="border-t border-stone-200 p-2">
      <li v-for="spot in spots" :key="spot.id"><button type="button" class="w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-900" :data-spot-id="spot.id" :aria-current="spot.id === selectedSpotId ? 'true' : undefined" @click="$emit('select', spot)"><span>{{ spot.name }}</span><span v-if="spot.categories.length" class="mt-1 block text-xs font-normal text-stone-500">{{ spot.categories.map(category => category.name).join('、') }}</span></button></li>
    </ul>
  </details>
</template>
