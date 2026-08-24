<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { createMapEditorReturnQuery, resolveMapEditorReturnContext } from '~/utils/map-editor-camera'
import { isGeoReferenced, type LatLng } from '~~/lib/geo'
import type { MapFloorListResponse } from '~~/shared/types/floor'
import type { MapViewerCameraState } from '~~/shared/types/map-viewer'
import type { AdminSpotListResponse, AdminSpotSummary, PositionedAdminSpotSummary, SpotPositionResponse } from '~~/shared/types/spot'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const LazyMapViewer = defineAsyncComponent(() => import('~/components/map/MapViewer.vue'))

const route = useRoute()
const mapId = route.params.mapId as string
const { data, error, status } = await useFetch<MapFloorListResponse>(`/api/maps/${mapId}/floors`)
const { data: spotData, refresh: refreshSpots } = await useFetch<AdminSpotListResponse>(`/api/maps/${mapId}/spots`)
const requestedFloorId = typeof route.query.floorId === 'string' ? route.query.floorId : ''
const requestedPlacementSpotId = typeof route.query.placeSpotId === 'string' ? route.query.placeSpotId : ''
const returnContext = resolveMapEditorReturnContext(
  route.query,
  data.value?.floors.map(floor => floor.id) ?? [],
)
const selectedFloorId = ref(requestedFloorId)
const position = ref<LatLng | null>(null)
const camera = ref<MapViewerCameraState | null>(returnContext)
const initialCamera = ref<MapViewerCameraState | null>(returnContext)
const selectedFloor = computed(() => data.value?.floors.find(floor => floor.id === selectedFloorId.value))
const selectedFloorSpots = computed(() => spotData.value?.spots.filter(spot => spot.floorId === selectedFloorId.value) ?? [])
const positionedFloorSpots = computed(() => selectedFloorSpots.value.filter(hasPosition))
const unpositionedFloorSpots = computed(() => selectedFloorSpots.value.filter(spot => !hasPosition(spot)))
const placementSpotId = ref(requestedPlacementSpotId)
const placementSpot = computed(() => unpositionedFloorSpots.value.find(spot => spot.id === placementSpotId.value) ?? null)
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

watch(selectedFloorId, () => {
  position.value = null
  if (!unpositionedFloorSpots.value.some(spot => spot.id === placementSpotId.value)) placementSpotId.value = ''
})

useHead({ title: 'ピン配置エディタ | デジタルマップ' })

function hasPosition(spot: AdminSpotSummary): spot is PositionedAdminSpotSummary {
  return spot.lat !== null && spot.lng !== null
}

function startRegistration() {
  if (!selectedFloor.value || !position.value || !camera.value) return
  const returnQuery = createMapEditorReturnQuery({
    floorId: selectedFloor.value.id,
    ...camera.value,
  })
  return navigateTo({
    path: `/admin/maps/${mapId}/spots/new`,
    query: {
      lat: position.value.lat.toString(),
      lng: position.value.lng.toString(),
      ...returnQuery,
    },
  })
}

async function placeExistingSpot() {
  if (!placementSpot.value || !position.value) return
  moveStatus.value = '位置を保存しています…'
  try {
    await $fetch<SpotPositionResponse>(`/api/maps/${mapId}/spots/${placementSpot.value.id}/position`, {
      method: 'PATCH',
      body: position.value,
    })
    await refreshSpots()
    placementSpotId.value = ''
    position.value = null
    moveStatus.value = '未配置スポットを地図上に配置しました。'
    await navigateTo({ path: route.path, query: { floorId: selectedFloorId.value } }, { replace: true })
  }
  catch {
    moveStatus.value = '位置を保存できませんでした。'
  }
}

function handleCameraChanged(value: MapViewerCameraState) {
  camera.value = value
  if (!initialCamera.value) return

  initialCamera.value = null
  void navigateTo({
    path: route.path,
    query: { floorId: selectedFloorId.value },
  }, { replace: true })
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
            :initial-camera="initialCamera"
            @camera-changed="handleCameraChanged"
            @spot-moved="saveMovedSpot"
          />
          <template #fallback><div class="h-[38rem] animate-pulse rounded-xl bg-stone-100" /></template>
        </ClientOnly>
        <aside class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <label for="placement-spot" class="text-sm font-bold text-stone-900">未配置スポットを選択</label>
          <select id="placement-spot" v-model="placementSpotId" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm">
            <option value="">新しいスポットを登録</option>
            <option v-for="spot in unpositionedFloorSpots" :key="spot.id" :value="spot.id">{{ spot.name }}</option>
          </select>
          <h2 class="font-bold text-stone-900">仮配置した位置</h2>
          <div v-if="position" class="mt-4 rounded-lg bg-stone-100 p-4 font-mono text-sm text-stone-700">
            <p>lat {{ position.lat.toFixed(7) }}</p>
            <p class="mt-1">lng {{ position.lng.toFixed(7) }}</p>
          </div>
          <p v-else class="mt-4 text-sm leading-6 text-stone-600">まだピンはありません。地図上の登録したい場所をクリックしてください。</p>
          <button v-if="placementSpot" type="button" :disabled="!position" class="mt-5 w-full rounded-lg bg-terracotta-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" @click="placeExistingSpot">この位置に配置する</button>
          <button v-else type="button" :disabled="!position" class="mt-5 w-full rounded-lg bg-terracotta-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" @click="startRegistration">この位置でスポット登録へ</button>
          <p v-if="moveStatus" role="status" class="mt-4 text-xs leading-5 text-stone-600">{{ moveStatus }}</p>

          <div class="mt-6 border-t border-stone-200 pt-5">
            <h2 class="font-bold text-stone-900">既存スポット</h2>
            <p class="mt-1 text-xs text-stone-500">地図上の黒いピンをドラッグして位置を調整できます。</p>
            <p v-if="selectedFloorSpots.length === 0" class="mt-3 text-sm text-stone-600">このフロアにはまだありません。</p>
            <ul v-else class="mt-3 space-y-2">
              <li v-for="spot in selectedFloorSpots" :key="spot.id" class="rounded-lg bg-stone-100 p-3">
                <NuxtLink :to="`/admin/maps/${mapId}/spots/${spot.id}`" class="text-sm font-semibold text-stone-900 hover:text-terracotta-700">{{ spot.name }}</NuxtLink>
                <p v-if="spot.lat !== null && spot.lng !== null" class="mt-1 font-mono text-[0.7rem] text-stone-500">{{ spot.lat.toFixed(6) }}, {{ spot.lng.toFixed(6) }}</p>
                <button v-else type="button" class="mt-1 text-left text-xs font-semibold text-terracotta-700" @click="placementSpotId = spot.id">このスポットを地図上に配置</button>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>
