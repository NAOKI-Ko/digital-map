<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import CategoryFilter from '~/components/map/CategoryFilter.vue'
import MapOperationHint from '~/components/map/MapOperationHint.vue'
import PublicFloorSelector from '~/components/map/PublicFloorSelector.vue'
import PublicMapInfo from '~/components/map/PublicMapInfo.vue'
import SpotDetailCard from '~/components/map/SpotDetailCard.vue'
import { collectSpotCategories, filterSpotsByCategoryIds } from '~/utils/category-filter'
import { createFloorSwitchState, shouldShowFloorSelector } from '~/utils/public-map-ui'
import type { MapViewerSpot } from '~~/shared/types/map-viewer'
import type { PublicMapResponse } from '~~/shared/types/public-map'
import { messages, normalizeLocale } from '~~/shared/i18n/messages'
import { recordMapViewOnce, sendPublicAnalytics } from '~/utils/public-analytics'
import { buildLocaleLinks, buildPublicLocaleUrl } from '~~/shared/utils/seo'

const LazyMapViewer = defineAsyncComponent(() => import('~/components/map/MapViewer.vue'))

const route = useRoute()
const mapSlug = computed(() => String(route.params.mapSlug ?? ''))
const requestedLocale = computed(() => normalizeLocale(route.query.lang))
const t = computed(() => messages[data.value?.map.locale ?? requestedLocale.value])
const { data, error, status } = await useFetch<PublicMapResponse>(
  () => `/api/public/${encodeURIComponent(mapSlug.value)}`,
  { query: computed(() => requestedLocale.value === 'en' ? { lang: 'en' } : {}) },
)
const selectedFloorId = ref('')
const selectedSpotId = ref<string | null>(null)
const selectedCategoryIds = ref<string[]>([])
const floorSelectorOpen = ref(false)
const infoOpen = ref(false)
const detailExpanded = ref(false)
let spotTrigger: HTMLElement | null = null
let spotTriggerId: string | null = null

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
const showFloorSelector = computed(() => shouldShowFloorSelector(data.value?.map.floors.length ?? 0))
const publicBaseUrl = useRuntimeConfig().public.publicBaseUrl as string
const localeUrl = (locale: 'ja' | 'en') => buildPublicLocaleUrl(publicBaseUrl, mapSlug.value, locale)
const absoluteImage = computed(() => data.value?.map.seo.imageUrl ? new URL(data.value.map.seo.imageUrl, publicBaseUrl).toString() : undefined)

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

useSeoMeta({
  title: () => data.value?.map.seo.title ? `${data.value.map.seo.title} | デジタルマップ` : '公開マップ | デジタルマップ',
  description: () => data.value?.map.seo.description || undefined,
  robots: () => error.value || !data.value?.map ? 'noindex,nofollow' : 'index,follow',
  ogTitle: () => data.value?.map.seo.title,
  ogDescription: () => data.value?.map.seo.description,
  ogUrl: () => data.value?.map ? localeUrl(data.value.map.locale) : undefined,
  ogImage: () => absoluteImage.value,
  ogType: 'website',
  twitterCard: () => absoluteImage.value ? 'summary_large_image' : 'summary',
  twitterTitle: () => data.value?.map.seo.title,
  twitterDescription: () => data.value?.map.seo.description,
  twitterImage: () => absoluteImage.value,
})
useHead(() => ({
  htmlAttrs: { lang: data.value?.map.locale ?? 'ja' },
  link: data.value?.map ? buildLocaleLinks(publicBaseUrl, mapSlug.value, data.value.map.locale, data.value.map.enabledLocales) : [],
  meta: data.value?.map ? [{ property: 'og:locale', content: data.value.map.locale === 'en' ? 'en_US' : 'ja_JP' }] : [],
}))

function selectSpot(spot: MapViewerSpot) {
  if (document.activeElement instanceof HTMLElement) spotTrigger = document.activeElement
  spotTriggerId = spot.id
  selectedSpotId.value = spot.id
  detailExpanded.value = false
  if (data.value?.map.id) sendPublicAnalytics({ type: 'SPOT_VIEW', mapId: data.value.map.id, spotId: spot.id })
}

function closeSpot() {
  selectedSpotId.value = null
  detailExpanded.value = false
  nextTick(() => requestAnimationFrame(() => {
    const fallback = spotTriggerId
      ? [...document.querySelectorAll<HTMLElement>('.map-viewer-marker[data-spot-id]')].find(element => element.dataset.spotId === spotTriggerId)
      : null
    ;(spotTrigger?.isConnected ? spotTrigger : fallback)?.focus()
    spotTrigger = null
    spotTriggerId = null
  }))
}

function selectFloor(floorId: string) {
  floorSelectorOpen.value = false
  const state = createFloorSwitchState(selectedFloorId.value, floorId)
  if (!state) return
  selectedSpotId.value = state.selectedSpotId
  selectedCategoryIds.value = state.selectedCategoryIds
  selectedFloorId.value = state.floorId
}

async function switchLocale(locale: 'ja' | 'en') {
  await navigateTo({ path: route.path, query: locale === 'en' ? { ...route.query, lang: 'en' } : Object.fromEntries(Object.entries(route.query).filter(([key]) => key !== 'lang')) })
}

onMounted(() => {
  if (!route.query.lang && data.value?.map.enabledLocales.includes('en') && navigator.language.toLowerCase().startsWith('en')) void switchLocale('en')
  if (data.value?.map.id && data.value.map.releaseId) recordMapViewOnce(data.value.map.id, data.value.map.releaseId)
})
</script>

<template>
  <main class="h-[100svh] overflow-hidden bg-stone-100 text-stone-900">
    <div v-if="status === 'pending'" class="grid h-full place-items-center px-6 text-sm text-stone-600">
      {{ t.loading }}
    </div>
    <div v-else-if="error" class="grid h-full place-items-center px-6">
      <section class="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <p class="text-sm font-semibold text-red-700">{{ t.error }}</p>
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
      <header class="hidden h-14 items-center justify-between gap-3 border-b border-white/60 bg-white/75 px-6 backdrop-blur sm:flex">
        <div class="flex min-w-0 items-center gap-3">
          <img v-if="data.map.logoUrl" :src="data.map.logoUrl" :alt="`${data.map.organizationName ?? data.map.name}のロゴ`" class="size-10 shrink-0 rounded-lg object-contain">
          <div class="min-w-0">
            <p class="truncate text-xs font-semibold tracking-widest text-terracotta-700">{{ data.map.organizationName ?? 'DIGITAL MAP' }}</p>
            <h1 class="mt-0.5 truncate text-lg font-bold tracking-tight">{{ data.map.name }}</h1>
          </div>
        </div>
        <nav aria-label="公開マップ操作" class="flex shrink-0 items-center gap-2">
          <label v-if="data.map.enabledLocales.includes('en')" class="sr-only" for="public-locale">{{ t.language }}</label>
          <select v-if="data.map.enabledLocales.includes('en')" id="public-locale" :value="data.map.locale" class="rounded-full border border-stone-200 px-2.5 py-1.5 text-xs" @change="switchLocale(($event.target as HTMLSelectElement).value as 'ja' | 'en')"><option value="ja">日本語</option><option value="en">English</option></select>
          <button type="button" class="grid size-11 place-items-center rounded-full border border-stone-200 bg-white/80 text-sm font-bold" aria-label="マップ情報を開く" @click="infoOpen = true">i</button>
        </nav>
      </header>

      <section class="relative h-[100svh] min-h-0 sm:h-[calc(100svh-3.5rem)]">
        <div v-if="showFloorSelector" class="absolute left-3 top-3 z-20 max-w-[calc(100%-8.5rem)] sm:left-5 sm:top-5 sm:max-w-none">
          <button type="button" class="flex min-h-11 max-w-full items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 text-sm font-bold shadow-sm backdrop-blur" aria-haspopup="dialog" :aria-expanded="floorSelectorOpen" @click="floorSelectorOpen = true">
            <span class="truncate">{{ selectedFloor.name }}</span> <span class="shrink-0" aria-hidden="true">⌄</span>
          </button>
        </div>

        <div class="absolute right-3 top-3 z-20 flex items-center gap-2 sm:hidden">
          <label v-if="data.map.enabledLocales.includes('en')" class="sr-only" for="public-locale-mobile">{{ t.language }}</label>
          <select v-if="data.map.enabledLocales.includes('en')" id="public-locale-mobile" :value="data.map.locale" class="min-h-11 rounded-full border border-white/70 bg-white/80 px-3 text-xs font-bold shadow-sm backdrop-blur" @change="switchLocale(($event.target as HTMLSelectElement).value as 'ja' | 'en')"><option value="ja">JA</option><option value="en">EN</option></select>
          <span v-else class="grid size-11 place-items-center rounded-full border border-white/70 bg-white/80 text-xs font-bold shadow-sm backdrop-blur" aria-label="言語: 日本語">JA</span>
          <button type="button" class="grid size-11 place-items-center rounded-full border border-white/70 bg-white/80 text-sm font-bold shadow-sm backdrop-blur" aria-label="マップ情報を開く" @click="infoOpen = true">i</button>
        </div>

        <div
          v-show="!detailExpanded"
          class="pointer-events-none absolute left-1/2 z-20 w-[min(50vw,44rem)] -translate-x-1/2 transition-[bottom] max-sm:w-[calc(100vw-1.5rem)]"
          :class="selectedSpot ? 'bottom-[calc(12rem+env(safe-area-inset-bottom))] sm:bottom-[max(1rem,env(safe-area-inset-bottom))]' : 'bottom-[calc(2.5rem+env(safe-area-inset-bottom))] sm:bottom-[max(1rem,env(safe-area-inset-bottom))]'"
        >
          <div class="pointer-events-auto">
            <CategoryFilter v-model="selectedCategoryIds" :categories="categories" />
          </div>
        </div>

        <ClientOnly>
          <LazyMapViewer
            class="h-full"
            :floor="selectedFloor"
            :spots="visibleSpots"
            :decorations="selectedFloor.decorations"
            mode="view"
            :selected-spot-id="selectedSpotId"
            :prioritize-visible-spots="selectedCategoryIds.length > 0"
            height="100%"
            :label="`${data.map.name} ${selectedFloor.name}`"
            @spot-selected="selectSpot"
          />
          <template #fallback>
            <div class="h-full animate-pulse bg-stone-200" />
          </template>
        </ClientOnly>

        <ClientOnly>
          <MapOperationHint :storage-key="`digital-map:operation-hint:${data.map.slug}`" />
        </ClientOnly>
      </section>

      <SpotDetailCard
        v-if="selectedSpot"
        :spot="selectedSpot"
        @close="closeSpot"
        @expanded-change="detailExpanded = $event"
      />
      <PublicFloorSelector v-if="floorSelectorOpen" :floors="data.map.floors" :model-value="selectedFloorId" @select="selectFloor" @close="floorSelectorOpen = false" />
      <PublicMapInfo v-if="infoOpen" :map-name="data.map.name" :organization-name="data.map.organizationName" :logo-url="data.map.logoUrl" :website-url="data.map.websiteUrl" :sns-url="data.map.snsUrl" :official-label="t.official" @close="infoOpen = false" />
    </template>
  </main>
</template>

<style scoped>
:deep(.maplibregl-map) {
  border-radius: 0;
}
</style>
