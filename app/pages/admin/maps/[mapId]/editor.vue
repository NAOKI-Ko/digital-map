<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue'
import { createMapEditorReturnQuery, resolveMapEditorReturnContext } from '~/utils/map-editor-camera'
import { isGeoReferenced, type ImagePosition } from '~~/lib/geo'
import { getAddressPlacementCandidate } from '~~/lib/address-placement'
import type { GeocodeResponse, GeocodeResult } from '~~/shared/types/geocode'
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
const position = ref<ImagePosition | null>(null)
const camera = ref<MapViewerCameraState | null>(returnContext)
const initialCamera = ref<MapViewerCameraState | null>(returnContext)
const selectedFloor = computed(() => data.value?.floors.find(floor => floor.id === selectedFloorId.value))
const selectedFloorSpots = computed(() => spotData.value?.spots.filter(spot => spot.floorId === selectedFloorId.value) ?? [])
const positionedFloorSpots = computed(() => selectedFloorSpots.value.filter(hasPosition))
const placementSpotId = ref(requestedPlacementSpotId)
const placementSpot = computed(() => selectedFloorSpots.value.find(spot => spot.id === placementSpotId.value) ?? null)
const placementSpotIsPositioned = computed(() => Boolean(placementSpot.value && hasPosition(placementSpot.value)))
const moveStatus = ref('')
const mapRevision = ref(0)
const unplaceConfirmOpen = ref(false)
const addressCandidates = ref<GeocodeResult[]>([])
const addressSearchStatus = ref('')
const isSearchingAddress = ref(false)
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
  if (!selectedFloorSpots.value.some(spot => spot.id === placementSpotId.value)) placementSpotId.value = ''
})

watch(placementSpot, (spot) => {
  position.value = spot && hasPosition(spot)
    ? { x: spot.x, y: spot.y }
    : null
  mapRevision.value += 1
  addressCandidates.value = []
  addressSearchStatus.value = ''
}, { immediate: true })

useHead({ title: 'ピン配置エディタ | デジタルマップ' })

function hasPosition(spot: AdminSpotSummary): spot is PositionedAdminSpotSummary {
  return spot.x !== null && spot.y !== null
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
      x: position.value.x.toString(),
      y: position.value.y.toString(),
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
    moveStatus.value = 'スポットの位置を保存しました。'
    await navigateTo({ path: route.path, query: { floorId: selectedFloorId.value } }, { replace: true })
  }
  catch {
    moveStatus.value = '位置を保存できませんでした。'
  }
}

function cancelPositionEditing() {
  const spot = placementSpot.value
  position.value = spot && hasPosition(spot)
    ? { x: spot.x, y: spot.y }
    : null
  placementSpotId.value = ''
  moveStatus.value = '位置の変更をキャンセルしました。保存済みの位置は変更していません。'
  mapRevision.value += 1
}

async function unplaceSpot() {
  const spot = placementSpot.value
  if (!spot) return
  moveStatus.value = 'PIN配置を解除しています…'
  try {
    await $fetch<SpotPositionResponse>(`/api/maps/${mapId}/spots/${spot.id}/position`, { method: 'DELETE' })
    await refreshSpots()
    placementSpotId.value = ''
    position.value = null
    unplaceConfirmOpen.value = false
    mapRevision.value += 1
    moveStatus.value = 'PIN配置を解除しました。公開中だった場合は下書きへ戻しました。'
  }
  catch {
    moveStatus.value = 'PIN配置を解除できませんでした。'
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

async function searchPlacementAddress() {
  const spot = placementSpot.value
  if (!spot?.address || !selectedFloor.value || !isGeoReferenced(selectedFloor.value)) return
  isSearchingAddress.value = true
  addressCandidates.value = []
  addressSearchStatus.value = '住所を検索しています…'
  try {
    const response = await $fetch<GeocodeResponse>('/api/geocode', { query: { q: spot.address } })
    addressCandidates.value = response.results
    addressSearchStatus.value = response.results.length
      ? '候補を選んで地図上の仮位置を確認してください。'
      : '候補が見つかりませんでした。地図上で手動配置できます。'
  }
  catch {
    addressSearchStatus.value = '住所を検索できませんでした。地図上で手動配置できます。'
  }
  finally {
    isSearchingAddress.value = false
  }
}

function chooseAddressCandidate(candidate: GeocodeResult) {
  const floor = selectedFloor.value
  if (!floor) return
  const imageCandidate = getAddressPlacementCandidate(floor, candidate)
  if (!imageCandidate) {
    addressSearchStatus.value = 'この住所候補はイラストの範囲外です。別の候補か手動配置を選んでください。'
    return
  }
  position.value = imageCandidate
  mapRevision.value += 1
  addressSearchStatus.value = '住所から仮配置しました。地図上で調整し、「この位置を保存」で確定してください。'
}

function updateCandidateFromDrag(value: { spotId: string, x: number, y: number }) {
  if (value.spotId !== placementSpotId.value) return
  position.value = { x: value.x, y: value.y }
  moveStatus.value = '候補位置を変更しました。「この位置を保存」で確定してください。'
}
</script>

<template>
  <div class="max-w-7xl">
    <AdminSubnavigation :map-id="mapId" area="map-edit" />
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
            :selected-spot-id="placementSpotId || null"
            :draggable-spot-id="placementSpotIsPositioned ? placementSpotId : null"
            label="ピン配置地図"
            :floor-error-action-to="geoReferenceEditorPath || null"
            :initial-camera="initialCamera"
            @camera-changed="handleCameraChanged"
            @spot-moved="updateCandidateFromDrag"
          />
          <template #fallback><div class="h-[38rem] animate-pulse rounded-xl bg-stone-100" /></template>
        </ClientOnly>
        <aside class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <label for="placement-spot" class="text-sm font-bold text-stone-900">位置を設定するスポット</label>
          <SaveFeedback v-if="route.query.saved === 'spot-created'" class="mt-3" state="success" message="スポットを登録しました。" />
          <select id="placement-spot" v-model="placementSpotId" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm">
            <option value="">新しいスポットを登録</option>
            <option v-for="spot in selectedFloorSpots" :key="spot.id" :value="spot.id">{{ spot.name }}（{{ hasPosition(spot) ? '配置済み' : '未配置' }}）</option>
          </select>
          <div v-if="placementSpot?.address && isGeoReferenced(selectedFloor)" class="mt-4 rounded-lg border border-stone-200 p-3">
            <p class="text-xs font-semibold text-stone-700">登録住所: {{ placementSpot.address }}</p>
            <button type="button" :disabled="isSearchingAddress" class="mt-2 w-full rounded-lg border border-terracotta-300 px-3 py-2 text-sm font-semibold text-terracotta-700 disabled:opacity-50" @click="searchPlacementAddress">{{ isSearchingAddress ? '検索中…' : '住所から位置候補を探す' }}</button>
            <ul v-if="addressCandidates.length" class="mt-3 space-y-2">
              <li v-for="candidate in addressCandidates" :key="candidate.id">
                <button type="button" class="w-full rounded-lg bg-stone-100 p-2 text-left text-xs leading-5 text-stone-700 hover:bg-stone-200" @click="chooseAddressCandidate(candidate)">{{ candidate.displayName }}</button>
              </li>
            </ul>
            <p v-if="addressSearchStatus" role="status" class="mt-2 text-xs leading-5 text-stone-600">{{ addressSearchStatus }}</p>
          </div>
          <h2 class="font-bold text-stone-900">仮配置した位置</h2>
          <div v-if="position" class="mt-4 rounded-lg bg-stone-100 p-4 font-mono text-sm text-stone-700">
            <p>x {{ position.x.toFixed(7) }}</p>
            <p class="mt-1">y {{ position.y.toFixed(7) }}</p>
          </div>
          <p v-else class="mt-4 text-sm leading-6 text-stone-600">まだピンはありません。地図上の登録したい場所をクリックしてください。</p>
          <button v-if="placementSpot" type="button" :disabled="!position" class="mt-5 w-full rounded-lg bg-terracotta-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" @click="placeExistingSpot">この位置を保存</button>
          <button v-else type="button" :disabled="!position" class="mt-5 w-full rounded-lg bg-terracotta-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" @click="startRegistration">この位置でスポット登録へ</button>
          <div v-if="placementSpot" class="mt-2 grid gap-2">
            <button type="button" class="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700" @click="cancelPositionEditing">キャンセル</button>
            <button v-if="hasPosition(placementSpot)" type="button" class="rounded-lg px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50" @click="unplaceConfirmOpen = true">PIN配置を解除</button>
          </div>
          <p v-if="moveStatus" role="status" class="mt-4 text-xs leading-5 text-stone-600">{{ moveStatus }}</p>

          <div class="mt-6 border-t border-stone-200 pt-5">
            <h2 class="font-bold text-stone-900">既存スポット</h2>
            <p class="mt-1 text-xs text-stone-500">位置を設定・再設定するスポットを選ぶと、クリックまたは対象PINのドラッグで候補を調整できます。保存するまで登録位置は変わりません。</p>
            <p v-if="selectedFloorSpots.length === 0" class="mt-3 text-sm text-stone-600">このフロアにはまだありません。</p>
            <ul v-else class="mt-3 space-y-2">
              <li v-for="spot in selectedFloorSpots" :key="spot.id" class="rounded-lg bg-stone-100 p-3">
                <NuxtLink :to="`/admin/maps/${mapId}/spots/${spot.id}`" class="text-sm font-semibold text-stone-900 hover:text-terracotta-700">{{ spot.name }}</NuxtLink>
                <p v-if="spot.x !== null && spot.y !== null" class="mt-1 font-mono text-[0.7rem] text-stone-500">x {{ spot.x.toFixed(4) }}, y {{ spot.y.toFixed(4) }}</p>
                <button type="button" class="mt-1 text-left text-xs font-semibold text-terracotta-700" @click="placementSpotId = spot.id">{{ hasPosition(spot) ? '位置を再設定' : '位置を設定' }}</button>
              </li>
            </ul>
          </div>
        </aside>
      </div>
      <ConfirmDialog :open="unplaceConfirmOpen" title="PIN配置を解除" message="Spot情報とカテゴリーは残したまま、イラスト上の配置を解除します。公開中の場合は下書きへ戻ります。" confirm-label="配置を解除する" destructive @cancel="unplaceConfirmOpen = false" @confirm="unplaceSpot" />
    </template>
  </div>
</template>
