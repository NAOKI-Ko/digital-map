<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import CategoryFilter from '~/components/map/CategoryFilter.vue'
import FloorTabs from '~/components/map/FloorTabs.vue'
import MapOperationHint from '~/components/map/MapOperationHint.vue'
import SpotDetailCard from '~/components/map/SpotDetailCard.vue'
import { collectSpotCategories, filterSpotsByCategoryIds } from '~/utils/category-filter'
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
const selectedCategoryIds = ref<string[]>([])

const selectedFloor = computed(() => (
  data.value?.map.floors.find(floor => floor.id === selectedFloorId.value)
  ?? data.value?.map.floors[0]
))
const selectedSpot = computed(() => (
  selectedFloor.value?.spots.find(spot => spot.id === selectedSpotId.value)
  ?? null
))
const categories = computed(() => (
  collectSpotCategories(selectedFloor.value?.spots ?? [])
))
const visibleSpots = computed(() => filterSpotsByCategoryIds(selectedFloor.value?.spots ?? [], selectedCategoryIds.value))

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
  selectedCategoryIds.value = []
})

watch(selectedCategoryIds, () => {
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
  <main class="h-[100svh] overflow-hidden bg-stone-100 text-stone-900">
    <div v-if="status === 'pending'" class="grid h-full place-items-center px-6 text-sm text-stone-600">
      マップを読み込んでいます…
    </div>
    <div v-else-if="error" class="grid h-full place-items-center px-6">
      <section class="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <p class="text-sm font-semibold text-red-700">公開マップを表示できません</p>
        <p class="mt-3 text-sm leading-6 text-stone-600">URLが正しいか、マップが公開中かをご確認ください。</p>
      </section>
    </div>
    <div v-else-if="!data?.map.floors.length" class="grid h-full place-items-center px-6">
      <section class="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 class="text-xl font-bold">{{ data?.map.name }}</h1>
        <p class="mt-3 text-sm text-stone-600">閲覧できるフロアがまだありません。</p>
      </section>
    </div>
    <template v-else-if="selectedFloor">
      <header class="flex h-16 items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 sm:px-6">
        <div class="flex min-w-0 items-center gap-3">
          <img v-if="data.map.logoUrl" :src="data.map.logoUrl" :alt="`${data.map.organizationName ?? data.map.name}のロゴ`" class="size-10 shrink-0 rounded-lg object-contain">
          <div class="min-w-0">
            <p class="truncate text-xs font-semibold tracking-widest text-terracotta-700">{{ data.map.organizationName ?? 'DIGITAL MAP' }}</p>
            <h1 class="mt-0.5 truncate text-lg font-bold tracking-tight sm:text-xl">{{ data.map.name }}</h1>
          </div>
        </div>
        <nav v-if="data.map.websiteUrl || data.map.snsUrl" aria-label="団体リンク" class="flex shrink-0 items-center gap-1 sm:gap-2">
          <a v-if="data.map.websiteUrl" :href="data.map.websiteUrl" target="_blank" rel="noopener noreferrer" class="rounded-full border border-stone-200 px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 sm:px-3">公式</a>
          <a v-if="data.map.snsUrl" :href="data.map.snsUrl" target="_blank" rel="noopener noreferrer" class="rounded-full border border-stone-200 px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 sm:px-3">SNS</a>
        </nav>
      </header>

      <section class="relative min-h-0">
        <div class="pointer-events-none absolute left-3 right-[3.75rem] top-3 z-20 sm:left-5 sm:right-20">
          <div class="pointer-events-auto">
            <FloorTabs
              v-model="selectedFloorId"
              :floors="data.map.floors"
            />
          </div>
        </div>

        <div
          class="pointer-events-none absolute inset-x-3 z-20 transition-[bottom] sm:bottom-auto sm:left-5 sm:right-20 sm:top-[4.25rem]"
          :class="selectedSpot ? 'bottom-[calc(8.75rem+env(safe-area-inset-bottom))]' : 'bottom-[max(1rem,env(safe-area-inset-bottom))]'"
        >
          <div class="pointer-events-auto">
            <CategoryFilter v-model="selectedCategoryIds" :categories="categories" />
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

        <ClientOnly>
          <MapOperationHint :storage-key="`digital-map:operation-hint:${data.map.slug}`" />
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
