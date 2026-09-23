<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import CategoryFilter from '~/components/map/CategoryFilter.vue'
import MapOperationHint from '~/components/map/MapOperationHint.vue'
import PublicFloorSelector from '~/components/map/PublicFloorSelector.vue'
import PublicMapInfo from '~/components/map/PublicMapInfo.vue'
import SpotDetailCard from '~/components/map/SpotDetailCard.vue'
import { collectSpotCategories, filterSpotsByCategoryIds } from '~/utils/category-filter'
import { closeFilteredSpot, createFloorSwitchState, selectedSpotIdFromOverlay, shouldShowFloorSelector, type PublicOverlay } from '~/utils/public-map-ui'
import type { MapViewerSpot } from '~~/shared/types/map-viewer'
import type { PublicMapResponse } from '~~/shared/types/public-map'
import { messages, normalizeLocale } from '~~/shared/i18n/messages'
import { recordMapViewOnce, sendPublicAnalytics } from '~/utils/public-analytics'
import { buildLocaleLinks, buildPublicLocaleUrl } from '~~/shared/utils/seo'
import { createPublicMapDecorationFixture } from '~/utils/public-map-decoration-fixture'

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
const overlay = ref<PublicOverlay>(null)
const selectedSpotId = computed(() => selectedSpotIdFromOverlay(overlay.value))
const selectedCategoryIds = ref<string[]>([])
const mapViewerRef = ref<{ ensureSpotVisible: (spotId: string, panel: DOMRect | null) => boolean, compareCamera: (pitch: 0 | 20 | 45, fit: boolean) => void } | null>(null)
const cameraComparisonEnabled = computed(() => import.meta.dev && route.query.cameraCompare === '1')
const cameraComparisonMode = ref<'same' | 'fit'>('same')
const floorSelectorOpen = computed(() => overlay.value?.type === 'floor')
const infoOpen = computed(() => overlay.value?.type === 'info')
let spotTrigger: HTMLElement | null = null
let spotTriggerId: string | null = null
let focusRestoreTimer: number | null = null
let pointerCloseCleanup: (() => void) | null = null

function clearPendingSpotClose() {
  pointerCloseCleanup?.()
  pointerCloseCleanup = null
  if (focusRestoreTimer !== null) window.clearTimeout(focusRestoreTimer)
  focusRestoreTimer = null
}

const selectedFloor = computed(() => (
  data.value?.map.floors.find(floor => floor.id === selectedFloorId.value)
  ?? data.value?.map.floors[0]
))
const selectedSpot = computed(() => (
  selectedFloor.value?.spots.find(spot => spot.id === selectedSpotId.value)
  ?? null
))
const displayedDecorations = computed(() => (
  import.meta.dev && route.query.decorationFixture === '1'
    ? [...(selectedFloor.value?.decorations ?? []), ...createPublicMapDecorationFixture()]
    : selectedFloor.value?.decorations ?? []
))
const categories = computed(() => (
  collectSpotCategories(selectedFloor.value?.spots ?? [])
))
const visibleSpots = computed(() => filterSpotsByCategoryIds(selectedFloor.value?.spots ?? [], selectedCategoryIds.value))
const showFloorSelector = computed(() => shouldShowFloorSelector(data.value?.map.floors.length ?? 0))
const appModalOpen = computed(() => overlay.value?.type === 'floor' || overlay.value?.type === 'info')
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
  overlay.value = null
  selectedCategoryIds.value = []
})

watch(selectedCategoryIds, () => {
  overlay.value = closeFilteredSpot(overlay.value, visibleSpots.value.map(spot => spot.id))
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
  spotTrigger = [...document.querySelectorAll<HTMLElement>('.map-viewer-marker[data-spot-id]')]
    .find(element => element.dataset.spotId === spot.id) ?? null
  spotTriggerId = spot.id
  overlay.value = { type: 'spot', spotId: spot.id }
  void nextTick(() => ensureSelectedSpotVisible())
  if (data.value?.map.id && mapSlug.value !== '__qa_arimatsu') sendPublicAnalytics({ type: 'SPOT_VIEW', mapId: data.value.map.id, spotId: spot.id })
}

function ensureSelectedSpotVisible() {
  if (!selectedSpotId.value) return
  const panel = document.querySelector<HTMLElement>('.spot-detail-sheet')?.getBoundingClientRect() ?? null
  mapViewerRef.value?.ensureSpotVisible(selectedSpotId.value, panel)
}

function compareCamera(pitch: 0 | 20 | 45) {
  mapViewerRef.value?.compareCamera(pitch, cameraComparisonMode.value === 'fit')
}

function closeSpot(source: 'pointer' | 'other' = 'other') {
  if (!selectedSpotId.value) return
  clearPendingSpotClose()
  const closingSpotId = selectedSpotId.value
  const closingTrigger = spotTrigger
  overlay.value = null
  const restoreFocus = () => {
    const fallbackMarker = [...document.querySelectorAll<HTMLElement>('.map-viewer-marker[data-spot-id]')]
      .find(element => element.dataset.spotId === closingSpotId)
    const mapEntry = document.querySelector<HTMLElement>('.map-viewer-frame [role="region"]')
    ;(closingTrigger?.isConnected ? closingTrigger : fallbackMarker ?? mapEntry)?.focus({ preventScroll: true })
    if (spotTriggerId === closingSpotId) {
      spotTrigger = null
      spotTriggerId = null
    }
  }
  if (source !== 'pointer') {
    nextTick(() => {
      focusRestoreTimer = window.setTimeout(() => {
        focusRestoreTimer = null
        restoreFocus()
      }, 50)
    })
    return
  }
  let finished = false
  let blockSameGestureClick: ((event: MouseEvent) => void) | null = null
  let finishTimer: number | null = null
  const cleanup = () => {
    window.removeEventListener('pointerup', finishPointerGesture, true)
    window.removeEventListener('mouseup', finishPointerGesture, true)
    if (blockSameGestureClick) window.removeEventListener('click', blockSameGestureClick, true)
    if (finishTimer !== null) window.clearTimeout(finishTimer)
    if (focusRestoreTimer !== null) window.clearTimeout(focusRestoreTimer)
    finishTimer = null
    focusRestoreTimer = null
  }
  const finishPointerGesture = () => {
    if (finished) return
    finished = true
    window.removeEventListener('pointerup', finishPointerGesture, true)
    window.removeEventListener('mouseup', finishPointerGesture, true)
    if (finishTimer !== null) window.clearTimeout(finishTimer)
    finishTimer = null
    blockSameGestureClick = (event: MouseEvent) => {
      event.preventDefault()
      event.stopImmediatePropagation()
    }
    window.addEventListener('click', blockSameGestureClick, { capture: true, once: true })
    nextTick(() => {
      focusRestoreTimer = window.setTimeout(() => {
        if (blockSameGestureClick) window.removeEventListener('click', blockSameGestureClick, true)
        focusRestoreTimer = null
        pointerCloseCleanup = null
        restoreFocus()
      })
    })
  }
  pointerCloseCleanup = cleanup
  window.addEventListener('pointerup', finishPointerGesture, true)
  window.addEventListener('mouseup', finishPointerGesture, true)
  finishTimer = window.setTimeout(finishPointerGesture, 1000)
}

function openFloorSelector() {
  overlay.value = { type: 'floor' }
}

function openInfo() {
  overlay.value = { type: 'info' }
}

function selectFloor(floorId: string) {
  overlay.value = null
  const state = createFloorSwitchState(selectedFloorId.value, floorId)
  if (!state) return
  selectedCategoryIds.value = state.selectedCategoryIds
  selectedFloorId.value = state.floorId
}

async function switchLocale(locale: 'ja' | 'en') {
  await navigateTo({ path: route.path, query: locale === 'en' ? { ...route.query, lang: 'en' } : Object.fromEntries(Object.entries(route.query).filter(([key]) => key !== 'lang')) })
}

onMounted(() => {
  if (!route.query.lang && data.value?.map.enabledLocales.includes('en') && navigator.language.toLowerCase().startsWith('en')) void switchLocale('en')
  if (data.value?.map.id && data.value.map.releaseId && mapSlug.value !== '__qa_arimatsu') recordMapViewOnce(data.value.map.id, data.value.map.releaseId)
})
onBeforeUnmount(clearPendingSpotClose)
</script>

<template>
  <main class="fixed inset-0 h-[100dvh] w-screen overflow-hidden bg-stone-100 text-stone-900 md:static md:w-auto">
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
      <header class="hidden h-14 items-center justify-between gap-3 border-b border-white/60 bg-white/75 px-6 backdrop-blur md:flex">
        <div class="flex min-w-0 items-center gap-3">
          <img v-if="data.map.logoUrl" :src="data.map.logoUrl" :alt="`${data.map.organizationName ?? data.map.name}のロゴ`" class="size-10 shrink-0 rounded-lg object-contain">
          <div class="min-w-0">
            <p class="truncate text-xs font-semibold tracking-widest text-terracotta-700">{{ data.map.organizationName ?? 'DIGITAL MAP' }}</p>
            <h1 class="mt-0.5 truncate text-lg font-bold tracking-tight">{{ data.map.name }}</h1>
          </div>
        </div>
        <nav v-show="!appModalOpen" aria-label="公開マップ操作" class="flex shrink-0 items-center gap-2">
          <label v-if="data.map.enabledLocales.includes('en')" class="sr-only" for="public-locale">{{ t.language }}</label>
          <select v-if="data.map.enabledLocales.includes('en')" id="public-locale" :value="data.map.locale" class="rounded-full border border-stone-200 px-2.5 py-1.5 text-xs" @change="switchLocale(($event.target as HTMLSelectElement).value as 'ja' | 'en')"><option value="ja">日本語</option><option value="en">English</option></select>
          <button type="button" class="grid size-11 place-items-center rounded-full border border-stone-200 bg-white/80 text-sm font-bold" aria-label="マップ情報を開く" @click="openInfo">i</button>
        </nav>
      </header>

      <section class="public-map-stage relative h-[100dvh] min-h-0 md:h-[calc(100dvh-3.5rem)]" :class="{ 'public-map-locked': appModalOpen, 'public-map-has-spot': Boolean(selectedSpot) }">
        <div v-show="!appModalOpen" class="pointer-events-none absolute inset-0 z-20 md:hidden" aria-label="公開マップ操作">
          <div v-if="showFloorSelector" class="pointer-events-auto absolute left-[calc(env(safe-area-inset-left)+0.75rem)] top-[calc(env(safe-area-inset-top)+0.75rem)] max-w-[40vw]">
          <button type="button" class="flex h-11 max-w-full items-center gap-2 rounded-full border border-white/70 bg-white/85 px-4 text-sm font-bold shadow-sm backdrop-blur" aria-haspopup="dialog" :aria-expanded="floorSelectorOpen" @click="openFloorSelector">
            <span class="truncate">{{ selectedFloor.name }}</span> <span class="shrink-0" aria-hidden="true">⌄</span>
          </button>
          </div>

        <div class="pointer-events-auto absolute right-[calc(env(safe-area-inset-right)+0.75rem)] top-[calc(env(safe-area-inset-top)+0.75rem)] flex items-center gap-2">
          <label v-if="data.map.enabledLocales.includes('en')" class="sr-only" for="public-locale-mobile">{{ t.language }}</label>
          <select v-if="data.map.enabledLocales.includes('en')" id="public-locale-mobile" :value="data.map.locale" class="h-11 w-16 rounded-full border border-white/70 bg-white/85 px-3 text-xs font-bold shadow-sm backdrop-blur" @change="switchLocale(($event.target as HTMLSelectElement).value as 'ja' | 'en')"><option value="ja">JA</option><option value="en">EN</option></select>
          <span v-else class="grid h-11 w-16 place-items-center rounded-full border border-white/70 bg-white/85 text-xs font-bold shadow-sm backdrop-blur" aria-label="言語: 日本語">JA</span>
          <button type="button" class="grid size-11 place-items-center rounded-full border border-white/70 bg-white/85 text-sm font-bold shadow-sm backdrop-blur" aria-label="マップ情報を開く" @click="openInfo">i</button>
        </div>
        </div>

        <div v-if="showFloorSelector && !appModalOpen" class="absolute left-5 top-5 z-20 hidden md:block">
          <button type="button" class="flex min-h-11 max-w-full items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 text-sm font-bold shadow-sm backdrop-blur" aria-haspopup="dialog" :aria-expanded="floorSelectorOpen" @click="openFloorSelector"><span class="truncate">{{ selectedFloor.name }}</span><span aria-hidden="true">⌄</span></button>
        </div>

        <div
          v-show="!appModalOpen && !selectedSpot"
          class="pointer-events-none absolute bottom-[calc(env(safe-area-inset-bottom)+2rem)] left-[calc(env(safe-area-inset-left)+0.75rem)] right-[calc(env(safe-area-inset-right)+0.75rem)] z-20 md:left-1/2 md:right-auto md:w-[min(50vw,44rem)] md:-translate-x-1/2"
        >
          <div class="pointer-events-auto">
            <CategoryFilter v-model="selectedCategoryIds" :categories="categories" />
          </div>
        </div>

        <ClientOnly>
          <LazyMapViewer
            ref="mapViewerRef"
            class="h-full"
            :floor="selectedFloor"
            :spots="visibleSpots"
            :decorations="displayedDecorations"
            mode="view"
            :selected-spot-id="selectedSpotId"
            :prioritize-visible-spots="selectedCategoryIds.length > 0"
            mobile-cover
            height="100%"
            :label="`${data.map.name} ${selectedFloor.name}`"
            @spot-selected="selectSpot"
          />
          <template #fallback>
            <div class="h-full animate-pulse bg-stone-200" />
          </template>
        </ClientOnly>

        <div v-if="cameraComparisonEnabled" class="absolute bottom-24 left-3 z-30 rounded-xl bg-white/95 p-3 text-xs shadow-lg" aria-label="開発用カメラ比較">
          <p class="mb-2 font-bold">開発用カメラ比較</p>
          <label class="mr-2"><input v-model="cameraComparisonMode" type="radio" value="same"> center/zoom固定</label>
          <label><input v-model="cameraComparisonMode" type="radio" value="fit"> 角度別fit</label>
          <div class="mt-2 flex gap-2">
            <button v-for="pitch in ([0, 20, 45] as const)" :key="pitch" type="button" class="rounded border border-stone-300 px-3 py-2" @click="compareCamera(pitch)">{{ pitch }}°</button>
          </div>
        </div>

        <ClientOnly>
          <MapOperationHint :storage-key="`digital-map:operation-hint:${data.map.slug}`" />
        </ClientOnly>
      </section>

      <SpotDetailCard
        v-if="selectedSpot"
        :spot="selectedSpot"
        @close="closeSpot"
        @expanded-change="() => nextTick(ensureSelectedSpotVisible)"
      />
      <PublicFloorSelector v-if="floorSelectorOpen" :floors="data.map.floors" :model-value="selectedFloorId" @select="selectFloor" @close="overlay = null" />
      <PublicMapInfo v-if="infoOpen" :map-name="data.map.name" :organization-name="data.map.organizationName" :logo-url="data.map.logoUrl" :website-url="data.map.websiteUrl" :sns-url="data.map.snsUrl" :official-label="t.official" @close="overlay = null" />
    </template>
  </main>
</template>

<style scoped>
:deep(.maplibregl-map) {
  border-radius: 0;
}

@media (min-width: 768px) {
  .public-map-has-spot :deep(.maplibregl-ctrl-top-right) {
    right: calc(min(32rem, 100vw - 2.5rem) + 2rem);
  }
}
</style>
