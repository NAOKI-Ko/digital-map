<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import CategoryFilter from '~/components/map/CategoryFilter.vue'
import FloorTabs from '~/components/map/FloorTabs.vue'
import MapOperationHint from '~/components/map/MapOperationHint.vue'
import SpotDetailCard from '~/components/map/SpotDetailCard.vue'
import SpotAccessibleList from '~/components/map/SpotAccessibleList.vue'
import { collectSpotCategories, filterSpotsByCategoryIds } from '~/utils/category-filter'
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
  if (data.value?.map.id) sendPublicAnalytics({ type: 'SPOT_VIEW', mapId: data.value.map.id, spotId: spot.id })
}

function closeSpot() {
  selectedSpotId.value = null
  nextTick(() => requestAnimationFrame(() => {
    const fallback = spotTriggerId
      ? [...document.querySelectorAll<HTMLElement>('.map-viewer-marker[data-spot-id]')].find(element => element.dataset.spotId === spotTriggerId)
      : null
    ;(spotTrigger?.isConnected ? spotTrigger : fallback)?.focus()
    spotTrigger = null
    spotTriggerId = null
  }))
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
      <header class="flex h-16 items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 sm:px-6">
        <div class="flex min-w-0 items-center gap-3">
          <img v-if="data.map.logoUrl" :src="data.map.logoUrl" :alt="`${data.map.organizationName ?? data.map.name}のロゴ`" class="size-10 shrink-0 rounded-lg object-contain">
          <div class="min-w-0">
            <p class="truncate text-xs font-semibold tracking-widest text-terracotta-700">{{ data.map.organizationName ?? 'DIGITAL MAP' }}</p>
            <h1 class="mt-0.5 truncate text-lg font-bold tracking-tight sm:text-xl">{{ data.map.name }}</h1>
          </div>
        </div>
        <nav aria-label="団体リンク" class="flex shrink-0 items-center gap-1 sm:gap-2">
          <NuxtLink to="/terms" class="text-xs text-stone-600 underline">規約</NuxtLink>
          <NuxtLink to="/privacy" class="text-xs text-stone-600 underline">Privacy</NuxtLink>
          <label v-if="data.map.enabledLocales.includes('en')" class="sr-only" for="public-locale">{{ t.language }}</label>
          <select v-if="data.map.enabledLocales.includes('en')" id="public-locale" :value="data.map.locale" class="rounded-full border border-stone-200 px-2.5 py-1.5 text-xs" @change="switchLocale(($event.target as HTMLSelectElement).value as 'ja' | 'en')"><option value="ja">日本語</option><option value="en">English</option></select>
          <a v-if="data.map.websiteUrl" :href="data.map.websiteUrl" target="_blank" rel="noopener noreferrer" class="rounded-full border border-stone-200 px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 sm:px-3">{{ t.official }}</a>
          <a v-if="data.map.snsUrl" :href="data.map.snsUrl" target="_blank" rel="noopener noreferrer" class="rounded-full border border-stone-200 px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 sm:px-3">SNS</a>
        </nav>
      </header>

      <section class="relative min-h-0">
        <SpotAccessibleList :spots="visibleSpots" :selected-spot-id="selectedSpotId" @select="selectSpot" />
        <div class="pointer-events-none absolute left-3 right-[3.75rem] top-3 z-20 sm:left-5 sm:right-20">
          <div class="pointer-events-auto">
            <FloorTabs
              v-model="selectedFloorId"
              :floors="data.map.floors"
            />
          </div>
        </div>

        <div
          class="pointer-events-none absolute left-1/2 z-20 w-[min(50vw,44rem)] -translate-x-1/2 transition-[bottom] max-sm:w-[calc(100vw-1.5rem)]"
          :class="selectedSpot ? 'bottom-[calc(8.75rem+env(safe-area-inset-bottom))] sm:bottom-[max(1rem,env(safe-area-inset-bottom))]' : 'bottom-[max(1rem,env(safe-area-inset-bottom))]'"
        >
          <div class="pointer-events-auto">
            <CategoryFilter v-model="selectedCategoryIds" :categories="categories" />
          </div>
        </div>

        <ClientOnly>
          <LazyMapViewer
            :floor="selectedFloor"
            :spots="visibleSpots"
            :decorations="selectedFloor.decorations"
            mode="view"
            :selected-spot-id="selectedSpotId"
            :prioritize-visible-spots="selectedCategoryIds.length > 0"
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
        @close="closeSpot"
      />
    </template>
  </main>
</template>

<style scoped>
:deep(.maplibregl-map) {
  border-radius: 0;
}
</style>
