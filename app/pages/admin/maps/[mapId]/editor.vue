<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { isGeoReferenced, type LatLng } from '~~/lib/geo'
import type { MapFloorListResponse } from '~~/shared/types/floor'
import type { AdminSpotListResponse, AdminSpotSummary, PositionedAdminSpotSummary, SpotPositionResponse } from '~~/shared/types/spot'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const LazyMapViewer = defineAsyncComponent(() => import('~/components/map/MapViewer.vue'))

const route = useRoute()
const mapId = route.params.mapId as string
const { data, error, status } = await useFetch<MapFloorListResponse>(`/api/maps/${mapId}/floors`)
const { data: spotData, refresh: refreshSpots } = await useFetch<AdminSpotListResponse>(`/api/maps/${mapId}/spots`)
const requestedFloorId = typeof route.query.floorId === 'string' ? route.query.floorId : ''
const selectedFloorId = ref(requestedFloorId)
const position = ref<LatLng | null>(null)
const selectedFloor = computed(() => data.value?.floors.find(floor => floor.id === selectedFloorId.value))
const selectedFloorSpots = computed(() => spotData.value?.spots.filter(spot => spot.floorId === selectedFloorId.value) ?? [])
const positionedFloorSpots = computed(() => selectedFloorSpots.value.filter(hasPosition))
const moveStatus = ref('')
const mapRevision = ref(0)
const geoReferenceEditorPath = computed(() => selectedFloor.value
  ? `/admin/maps/${mapId}/floors/${selectedFloor.value.id}/georeference?from=editor`
  : '')
const shouldShowGeoReferenceWarning = computed(() => {
  const floor = selectedFloor.value
  return Boolean(floor && !isGeoReferenced(floor))
})

watch(() => data.value?.floors, (floors) => {
  if (floors?.length && !floors.some(floor => floor.id === selectedFloorId.value)) {
    selectedFloorId.value = floors[0]?.id ?? ''
  }
}, { immediate: true })

watch(selectedFloorId, () => position.value = null)

useHead({ title: 'ピン配置エディタ | デジタルマップ' })

function hasPosition(spot: AdminSpotSummary): spot is PositionedAdminSpotSummary {
  return spot.lat !== null && spot.lng !== null
}

function startRegistration() {
  if (!selectedFloor.value || !position.value) return
  return navigateTo({
    path: `/admin/maps/${mapId}/spots/new`,
    query: {
      floorId: selectedFloor.value.id,
      lat: position.value.lat.toString(),
      lng: position.value.lng.toString(),
    },
  })
}

async function saveMovedSpot(value: { spotId: string, lat: number, lng: number }) {
  moveStatus.value = '位置を保存しています…'
  try {
    const response = await $fetch<SpotPositionResponse>(`/api/maps/${mapId}/spots/${value.spotId}/position`, {
      method: 'PATCH',
      body: { lat: value.lat, lng: value.lng },
    })
    if (spotData.value) {
      spotData.value = {
        ...spotData.value,
        spots: spotData.value.spots.map(spot => spot.id === value.spotId
          ? { ...spot, ...response.position, updatedAt: new Date().toISOString() }
          : spot),
      }
    }
    moveStatus.value = 'ピンの位置を保存しました。'
  }
  catch {
    moveStatus.value = '位置を保存できませんでした。元の位置へ戻します。'
    await refreshSpots()
    mapRevision.value += 1
  }
}
</script>

<template>
  <div class="max-w-7xl">
    <NuxtLink :to="`/admin/maps/${mapId}/spots`" class="text-sm font-medium text-stone-600 hover:text-stone-900">← スポット一覧に戻る</NuxtLink>
    <header class="mt-5">
      <p class="text-sm font-medium text-terracotta-700">スポット管理</p>
      <h1 class="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">ピン配置エディタ</h1>
      <p class="mt-2 text-sm text-stone-600">フロアを選び、地図上の登録位置をクリックしてください。</p>
    </header>

    <div v-if="status === 'pending'" class="mt-8 rounded-xl bg-white p-8 text-sm text-stone-600">読み込んでいます…</div>
    <div v-else-if="error" class="mt-8 rounded-xl bg-red-50 p-8 text-sm text-red-700">フロアを読み込めませんでした。</div>
    <div v-else-if="!data?.floors.length" class="mt-8 rounded-xl bg-amber-50 p-8 text-sm text-amber-800">先にフロアを1件以上登録してください。</div>
    <template v-else-if="selectedFloor">
      <div class="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="編集フロア">
        <button v-for="floor in data.floors" :key="floor.id" type="button" role="tab" :aria-selected="floor.id === selectedFloorId" class="rounded-full px-4 py-2 text-sm font-semibold" :class="floor.id === selectedFloorId ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 shadow-sm'" @click="selectedFloorId = floor.id">{{ floor.name }}</button>
      </div>

      <div v-if="shouldShowGeoReferenceWarning" class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <span>ジオリファレンスを設定すると現在地機能が使えます。</span>
        <NuxtLink :to="geoReferenceEditorPath" class="shrink-0 rounded-lg bg-amber-800 px-4 py-2 font-semibold text-white hover:bg-amber-900">ジオリファレンスを設定</NuxtLink>
      </div>

      <div class="mt-5 grid gap-5 xl:grid-cols-[1fr_20rem]">
        <ClientOnly>
          <LazyMapViewer
            :key="mapRevision"
            v-model="position"
            :floor="selectedFloor"
            :spots="positionedFloorSpots"
            mode="edit"
            label="ピン配置地図"
            :floor-error-action-to="geoReferenceEditorPath || null"
            @spot-moved="saveMovedSpot"
          />
          <template #fallback><div class="h-[38rem] animate-pulse rounded-xl bg-stone-100" /></template>
        </ClientOnly>
        <aside class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 class="font-bold text-stone-900">仮配置した位置</h2>
          <div v-if="position" class="mt-4 rounded-lg bg-stone-100 p-4 font-mono text-sm text-stone-700">
            <p>lat {{ position.lat.toFixed(7) }}</p>
            <p class="mt-1">lng {{ position.lng.toFixed(7) }}</p>
          </div>
          <p v-else class="mt-4 text-sm leading-6 text-stone-600">まだピンはありません。地図上の登録したい場所をクリックしてください。</p>
          <button type="button" :disabled="!position" class="mt-5 w-full rounded-lg bg-terracotta-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" @click="startRegistration">この位置でスポット登録へ</button>
          <p v-if="moveStatus" role="status" class="mt-4 text-xs leading-5 text-stone-600">{{ moveStatus }}</p>

          <div class="mt-6 border-t border-stone-200 pt-5">
            <h2 class="font-bold text-stone-900">既存スポット</h2>
            <p class="mt-1 text-xs text-stone-500">地図上の黒いピンをドラッグして位置を調整できます。</p>
            <p v-if="selectedFloorSpots.length === 0" class="mt-3 text-sm text-stone-600">このフロアにはまだありません。</p>
            <ul v-else class="mt-3 space-y-2">
              <li v-for="spot in selectedFloorSpots" :key="spot.id" class="rounded-lg bg-stone-100 p-3">
                <NuxtLink :to="`/admin/maps/${mapId}/spots/${spot.id}`" class="text-sm font-semibold text-stone-900 hover:text-terracotta-700">{{ spot.name }}</NuxtLink>
                <p v-if="spot.lat !== null && spot.lng !== null" class="mt-1 font-mono text-[0.7rem] text-stone-500">{{ spot.lat.toFixed(6) }}, {{ spot.lng.toFixed(6) }}</p>
                <p v-else class="mt-1 text-xs font-medium text-amber-700">位置未設定（地図をクリックして新規登録するか、編集画面で入力してください）</p>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>
