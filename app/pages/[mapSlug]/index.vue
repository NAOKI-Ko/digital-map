<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import CategoryFilter from '~/components/map/CategoryFilter.vue'
import FloorTabs from '~/components/map/FloorTabs.vue'
import SpotDetailCard from '~/components/map/SpotDetailCard.vue'
import type { MapViewerSpot } from '~~/shared/types/map-viewer'
import type { PublicMapResponse } from '~~/shared/types/public-map'

const LazyMapViewer = defineAsyncComponent(() => import('~/components/map/MapViewer.vue'))

const route = useRoute()
const mapSlug = computed(() => String(route.params.mapSlug ?? ''))
const { data, error, status } = await useFetch<PublicMapResponse>(
  () => `/api/public/${encodeURIComponent(mapSlug.value)}`,
)
const selectedFloorId = ref('')
const selectedSpotId = ref<string | null>(null)
const selectedCategory = ref('')

const selectedFloor = computed(() => (
  data.value?.map.floors.find(floor => floor.id === selectedFloorId.value)
  ?? data.value?.map.floors[0]
))
const selectedSpot = computed(() => (
  selectedFloor.value?.spots.find(spot => spot.id === selectedSpotId.value)
  ?? null
))
const categories = computed(() => (
  [...new Set(selectedFloor.value?.spots.map(spot => spot.category) ?? [])]
    .sort((left, right) => left.localeCompare(right, 'ja'))
))
const visibleSpots = computed(() => selectedFloor.value?.spots.filter(spot => (
  selectedCategory.value === '' || spot.category === selectedCategory.value
)) ?? [])

watch(() => data.value?.map.floors, (floors) => {
  if (!floors?.length) {
    selectedFloorId.value = ''
    return
  }
  if (!floors.some(floor => floor.id === selectedFloorId.value)) {
    selectedFloorId.value = floors[0]?.id ?? ''
  }
}, { immediate: true })

watch(selectedFloorId, () => {
  selectedSpotId.value = null
  selectedCategory.value = ''
})

watch(selectedCategory, () => {
  if (!visibleSpots.value.some(spot => spot.id === selectedSpotId.value)) {
    selectedSpotId.value = null
  }
})

useHead(() => ({
  title: data.value?.map.name
    ? `${data.value.map.name} | デジタルマップ`
    : '公開マップ | デジタルマップ',
}))

function selectSpot(spot: MapViewerSpot) {
  selectedSpotId.value = spot.id
}
</script>

<template>
  <main class="min-h-screen bg-stone-100 text-stone-900">
    <div v-if="status === 'pending'" class="grid min-h-screen place-items-center px-6 text-sm text-stone-600">
      マップを読み込んでいます…
    </div>
    <div v-else-if="error" class="grid min-h-screen place-items-center px-6">
      <section class="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <p class="text-sm font-semibold text-red-700">公開マップを表示できません</p>
        <p class="mt-3 text-sm leading-6 text-stone-600">URLが正しいか、マップが公開中かをご確認ください。</p>
      </section>
    </div>
    <div v-else-if="!data?.map.floors.length" class="grid min-h-screen place-items-center px-6">
      <section class="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 class="text-xl font-bold">{{ data?.map.name }}</h1>
        <p class="mt-3 text-sm text-stone-600">閲覧できるフロアがまだありません。</p>
      </section>
    </div>
    <template v-else-if="selectedFloor">
      <header class="flex min-h-16 items-center border-b border-stone-200 bg-white px-4 py-3 sm:px-6">
        <div>
          <p class="text-xs font-semibold tracking-widest text-terracotta-700">DIGITAL MAP</p>
          <h1 class="mt-0.5 text-lg font-bold tracking-tight sm:text-xl">{{ data.map.name }}</h1>
        </div>
      </header>

      <section class="relative">
        <div class="pointer-events-none absolute inset-x-3 top-3 z-20 sm:inset-x-5">
          <div class="pointer-events-auto space-y-2">
            <FloorTabs
              v-model="selectedFloorId"
              :floors="data.map.floors"
            />
            <CategoryFilter v-model="selectedCategory" :categories="categories" />
          </div>
        </div>

        <ClientOnly>
          <LazyMapViewer
            :floor="selectedFloor"
            :spots="visibleSpots"
            mode="view"
            :selected-spot-id="selectedSpotId"
            height="calc(100svh - 4rem)"
            :label="`${data.map.name} ${selectedFloor.name}`"
            @spot-selected="selectSpot"
          />
          <template #fallback>
            <div class="h-[calc(100svh-4rem)] animate-pulse bg-stone-200" />
          </template>
        </ClientOnly>
      </section>

      <SpotDetailCard
        v-if="selectedSpot"
        :spot="selectedSpot"
        @close="selectedSpotId = null"
      />
    </template>
  </main>
</template>

<style scoped>
:deep(.maplibregl-map) {
  border-radius: 0;
}
</style>
