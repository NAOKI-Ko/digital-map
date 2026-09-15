<script setup lang="ts">
import SaveFeedback from '~/components/ui/SaveFeedback.vue'
import SpotCombobox from '~/components/admin/SpotCombobox.vue'
import PinDesignEditor from '~/components/admin/PinDesignEditor.vue'
import { defineAsyncComponent } from 'vue'
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue'
import { resolveMapEditorReturnContext } from '~/utils/map-editor-camera'
import { isGeoReferenced, type ImagePosition } from '~~/lib/geo'
import { getAddressPlacementCandidate } from '~~/lib/address-placement'
import type { GeocodeResponse, GeocodeResult } from '~~/shared/types/geocode'
import type { MapFloorListResponse } from '~~/shared/types/floor'
import type { MapViewerCameraState, MapViewerSpot } from '~~/shared/types/map-viewer'
import type { AdminSpotListResponse, AdminSpotSummary, PositionedAdminSpotSummary, SpotPinDesignResponse, SpotPositionResponse } from '~~/shared/types/spot'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const LazyMapViewer = defineAsyncComponent(() => import('~/components/map/MapViewer.vue'))
const mapViewerRef = useTemplateRef<{ focusSpot: (spotId: string) => boolean }>('mapViewer')
const pinDesignEditorRef = useTemplateRef<{ save: () => Promise<SpotPinDesignResponse['design'] | null> }>('pinDesignEditor')

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
const initialCamera = ref<MapViewerCameraState | null>(returnContext)
const selectedFloor = computed(() => data.value?.floors.find(floor => floor.id === selectedFloorId.value))
const selectedFloorSpots = computed(() => spotData.value?.spots.filter(spot => spot.floorId === selectedFloorId.value) ?? [])
const positionedFloorSpots = computed(() => selectedFloorSpots.value.filter(hasPosition))
const unpositionedFloorSpots = computed(() => selectedFloorSpots.value.filter(spot => !hasPosition(spot)))
const placementSpotId = ref(requestedPlacementSpotId)
const placementSpot = computed(() => selectedFloorSpots.value.find(spot => spot.id === placementSpotId.value) ?? null)
const placementSpotIsPositioned = computed(() => Boolean(placementSpot.value && hasPosition(placementSpot.value)))
const placementMode = ref<'idle' | 'placing' | 'moving'>('idle')
const placementActive = computed(() => placementMode.value !== 'idle')
const candidateKind = computed(() => placementMode.value === 'moving' ? 'move' : placementMode.value === 'placing' ? 'placement' : null)
const pendingPinDesign = ref<SpotPinDesignResponse['design'] | null>(null)
const candidateSpot = computed<MapViewerSpot | null>(() => {
  const spot = placementSpot.value
  if (!spot || !placementActive.value) return null
  const candidatePosition = position.value ?? (hasPosition(spot) ? { x: spot.x, y: spot.y } : null)
  if (!candidatePosition) return null
  return {
    ...spot,
    ...pendingPinDesign.value,
    x: candidatePosition.x,
    y: candidatePosition.y,
  }
})
const positionedSearchSpotId = computed({
  get: () => placementSpotIsPositioned.value ? placementSpotId.value : '',
  set: (spotId: string) => selectPositionedSpot(spotId),
})
const moveStatus = ref('')
const unplaceConfirmOpen = ref(false)
const addressCandidates = ref<GeocodeResult[]>([])
const addressSearchStatus = ref('')
const isSearchingAddress = ref(false)

watch(() => data.value?.floors, (floors) => {
  if (floors?.length && !floors.some(floor => floor.id === selectedFloorId.value)) {
    selectedFloorId.value = floors[0]?.id ?? ''
  }
}, { immediate: true })

watch(selectedFloorId, () => {
  position.value = null
  placementMode.value = 'idle'
  if (!selectedFloorSpots.value.some(spot => spot.id === placementSpotId.value)) placementSpotId.value = ''
})

watch(placementSpotId, () => {
  position.value = null
  placementMode.value = 'idle'
  addressCandidates.value = []
  addressSearchStatus.value = ''
  const spot = placementSpot.value
  pendingPinDesign.value = spot
    ? {
        pinIconType: spot.pinIconType,
        pinIconId: spot.pinIconId,
        pinIconImageUrl: spot.pinIconImageUrl,
        pinIconAssetId: spot.pinIconAssetId,
        pinColor: spot.pinColor,
        pinSize: spot.pinSize,
        importance: spot.importance,
      }
    : null
}, { immediate: true })

useHead({ title: 'ピン配置エディタ | デジタルマップ' })

function hasPosition(spot: AdminSpotSummary): spot is PositionedAdminSpotSummary {
  return spot.x !== null && spot.y !== null
}

function startPlacement() {
  if (!placementSpot.value || placementSpotIsPositioned.value) return
  position.value = null
  placementMode.value = 'placing'
  moveStatus.value = '配置モードです。地図をクリックして仮配置してください。'
}

function startMoving() {
  if (!placementSpot.value || !placementSpotIsPositioned.value) return
  position.value = null
  placementMode.value = 'moving'
  moveStatus.value = '移動モードです。PINをドラッグするか、地図をクリックしてください。'
}

async function savePosition() {
  if (!placementSpot.value || !position.value) return
  moveStatus.value = 'PINデザインと位置を保存しています…'
  try {
    const savedDesign = await pinDesignEditorRef.value?.save()
    if (!savedDesign) {
      moveStatus.value = 'PINデザインを保存できないため、位置は保存していません。入力内容を確認してください。'
      return
    }
    pendingPinDesign.value = savedDesign
    await $fetch<SpotPositionResponse>(`/api/maps/${mapId}/spots/${placementSpot.value.id}/position`, {
      method: 'PATCH',
      body: position.value,
    })
    await refreshSpots()
    position.value = null
    placementMode.value = 'idle'
    moveStatus.value = 'スポットの位置を保存しました。'
  }
  catch {
    moveStatus.value = '位置を保存できませんでした。'
  }
}

function cancelPositionEditing() {
  position.value = null
  placementMode.value = 'idle'
  moveStatus.value = '位置の変更をキャンセルしました。保存済みの位置は変更していません。'
}

async function unplaceSpot() {
  const spot = placementSpot.value
  if (!spot) return
  moveStatus.value = 'PIN配置を解除しています…'
  try {
    await $fetch<SpotPositionResponse>(`/api/maps/${mapId}/spots/${spot.id}/position`, { method: 'DELETE' })
    await refreshSpots()
    position.value = null
    placementMode.value = 'idle'
    unplaceConfirmOpen.value = false
    moveStatus.value = 'PIN配置を解除しました。公開中だった場合は下書きへ戻しました。'
  }
  catch {
    moveStatus.value = 'PIN配置を解除できませんでした。'
  }
}

function handleCameraChanged(_value: MapViewerCameraState) {
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
  addressSearchStatus.value = '住所から仮配置しました。地図上で調整し、「この位置を保存」で確定してください。'
}

function updateCandidateFromDrag(value: { spotId: string, x: number, y: number }) {
  if (placementMode.value !== 'moving' || value.spotId !== placementSpotId.value) return
  position.value = { x: value.x, y: value.y }
  moveStatus.value = '候補位置を変更しました。「この位置を保存」で確定してください。'
}

function selectExistingSpot(spot: { id: string }) {
  placementSpotId.value = spot.id
  position.value = null
  placementMode.value = 'idle'
  moveStatus.value = ''
}

function selectPositionedSpot(spotId: string) {
  const spot = positionedFloorSpots.value.find(item => item.id === spotId)
  if (!spot) return
  selectExistingSpot(spot)
  nextTick(() => mapViewerRef.value?.focusSpot(spotId))
}

function handlePinDesignChanged(design: SpotPinDesignResponse['design']) {
  pendingPinDesign.value = design
}

function updatePinDesign(design: SpotPinDesignResponse['design']) {
  if (!spotData.value || !placementSpot.value) return
  spotData.value = {
    ...spotData.value,
    spots: spotData.value.spots.map(spot => spot.id === placementSpot.value?.id ? { ...spot, ...design } : spot),
  }
  pendingPinDesign.value = design
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && placementActive.value) cancelPositionEditing()
}

onMounted(() => window.addEventListener('keydown', handleEscape))
onBeforeUnmount(() => window.removeEventListener('keydown', handleEscape))
</script>

<template>
  <div class="max-w-7xl">
    <AdminSubnavigation :map-id="mapId" area="map-edit" />
    <NuxtLink :to="`/admin/maps/${mapId}/spots`" class="text-sm font-medium text-stone-600 hover:text-stone-900">← スポット一覧に戻る</NuxtLink>
    <header class="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-2xl">PIN配置</h1>
        <p class="mt-1 text-sm text-stone-600">フロアイラスト上でPINを選択・配置し、右側のInspectorで編集します。</p>
      </div>
      <div class="w-full lg:max-w-sm">
        <SpotCombobox
          v-model="positionedSearchSpotId"
          :spots="positionedFloorSpots"
          label="配置済みSpotを検索"
          input-id="positioned-spot-search"
          placeholder="Spot名・カテゴリー・フロアで検索"
          empty-message="該当する配置済みSpotはありません。"
        />
      </div>
    </header>

    <div v-if="status === 'pending'" class="mt-8 rounded-xl bg-white p-8 text-sm text-stone-600">読み込んでいます…</div>
    <div v-else-if="error" class="mt-8 rounded-xl bg-red-50 p-8 text-sm text-red-700">フロアを読み込めませんでした。</div>
    <div v-else-if="!data?.floors.length" class="mt-8 rounded-xl bg-amber-50 p-8 text-sm text-amber-800">先にフロアを1件以上登録してください。</div>
    <template v-else-if="selectedFloor">
      <div class="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="編集フロア">
        <button v-for="floor in data.floors" :key="floor.id" type="button" role="tab" :aria-selected="floor.id === selectedFloorId" class="rounded-full px-4 py-2 text-sm font-semibold" :class="floor.id === selectedFloorId ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 shadow-sm'" @click="selectedFloorId = floor.id">{{ floor.name }}</button>
      </div>

      <div class="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <ClientOnly>
          <LazyMapViewer
            ref="mapViewer"
            v-model="position"
            :floor="selectedFloor"
            :spots="positionedFloorSpots"
            mode="edit"
            :selected-spot-id="placementSpotId || null"
            :candidate-spot="candidateSpot"
            :candidate-kind="candidateKind"
            :placement-enabled="placementActive"
            label="ピン配置地図"
            :initial-camera="initialCamera"
            @camera-changed="handleCameraChanged"
            @spot-moved="updateCandidateFromDrag"
            @spot-selected="selectExistingSpot"
          />
          <template #fallback><div class="h-[38rem] animate-pulse rounded-xl bg-stone-100" /></template>
        </ClientOnly>
        <aside class="self-start rounded-xl border border-stone-200 bg-white p-5 shadow-sm xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto">
          <SaveFeedback v-if="route.query.saved === 'spot-created'" class="mt-3" state="success" message="スポットを登録しました。" />
          <SpotCombobox v-model="placementSpotId" :spots="unpositionedFloorSpots" />
          <button v-if="placementSpot && !placementSpotIsPositioned && placementMode === 'idle'" type="button" class="mt-3 w-full rounded-lg bg-terracotta-600 px-4 py-2.5 text-sm font-semibold text-white" @click="startPlacement">ピンを配置</button>

          <section class="mt-6 border-t border-stone-200 pt-5" aria-live="polite">
            <h2 class="text-sm font-bold text-stone-900">選択中のスポット</h2>
            <p v-if="!placementSpot" class="mt-3 text-sm text-stone-600">地図上のPINを選択してください。</p>
            <template v-else>
              <h3 class="mt-3 text-lg font-bold text-stone-900">{{ placementSpot.name }}</h3>
              <p class="mt-1 text-xs text-stone-500">{{ placementSpot.floorName }}<span v-if="placementSpot.categories.length"> / {{ placementSpot.categories.map(category => category.name).join('・') }}</span></p>
              <div class="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span class="rounded-full bg-stone-100 px-2.5 py-1 text-stone-700">{{ placementSpotIsPositioned ? '配置済み' : '未配置' }}</span>
                <span class="rounded-full px-2.5 py-1" :class="placementSpot.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'">{{ placementSpot.isPublished ? '公開中' : '下書き' }}</span>
                <span class="rounded-full bg-stone-100 px-2.5 py-1 text-stone-700">サイズ: {{ ({ small: '小', medium: '中', large: '大' })[placementSpot.pinSize] }}</span>
                <span class="rounded-full bg-stone-100 px-2.5 py-1 text-stone-700">{{ placementSpot.importance === 'featured' ? '注目PIN' : '通常PIN' }}</span>
              </div>
              <NuxtLink :to="`/admin/maps/${mapId}/spots/${placementSpot.id}`" class="mt-3 inline-flex text-sm font-semibold text-terracotta-700">スポット詳細を開く</NuxtLink>
              <div v-if="placementSpotIsPositioned && placementMode === 'idle'" class="mt-4 grid grid-cols-2 gap-2">
                <button type="button" class="rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white" @click="startMoving">移動</button>
                <button type="button" class="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50" @click="unplaceConfirmOpen = true">配置を解除</button>
              </div>

              <details open class="mt-5 border-t border-stone-200 pt-4">
                <summary class="cursor-pointer text-sm font-bold text-stone-900">PINデザイン</summary>
                <div class="mt-4">
                  <PinDesignEditor
                    ref="pinDesignEditor"
                    :key="placementSpot.id"
                    :map-id="mapId"
                    :spot-id="placementSpot.id"
                    :initial-value="placementSpot"
                    compact
                    :show-save="false"
                    @changed="handlePinDesignChanged"
                    @updated="updatePinDesign"
                  />
                </div>
              </details>
            </template>
          </section>

          <div v-if="placementSpot?.address && placementActive && isGeoReferenced(selectedFloor)" class="mt-4 rounded-lg border border-stone-200 p-3">
            <p class="text-xs font-semibold text-stone-700">登録住所: {{ placementSpot.address }}</p>
            <button type="button" :disabled="isSearchingAddress" class="mt-2 w-full rounded-lg border border-terracotta-300 px-3 py-2 text-sm font-semibold text-terracotta-700 disabled:opacity-50" @click="searchPlacementAddress">{{ isSearchingAddress ? '検索中…' : '住所から位置候補を探す' }}</button>
            <ul v-if="addressCandidates.length" class="mt-3 space-y-2">
              <li v-for="candidate in addressCandidates" :key="candidate.id">
                <button type="button" class="w-full rounded-lg bg-stone-100 p-2 text-left text-xs leading-5 text-stone-700 hover:bg-stone-200" @click="chooseAddressCandidate(candidate)">{{ candidate.displayName }}</button>
              </li>
            </ul>
            <p v-if="addressSearchStatus" role="status" class="mt-2 text-xs leading-5 text-stone-600">{{ addressSearchStatus }}</p>
          </div>
          <div v-if="placementActive" class="mt-4 rounded-lg border border-terracotta-200 bg-terracotta-50 p-3 text-sm font-semibold text-terracotta-900">
            {{ placementMode === 'moving' ? (position ? '移動先を確認し、保存してください。' : '元のPINは薄く表示されています。地図をクリックして移動先を仮配置してください。') : (position ? '仮配置を確認し、保存してください。' : '地図をクリックして仮配置してください。') }}
          </div>
          <button v-if="placementActive" type="button" :disabled="!position" class="mt-4 w-full rounded-lg bg-terracotta-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" @click="savePosition">PINデザインと位置を保存</button>
          <div v-if="placementActive" class="mt-2 grid gap-2">
            <button type="button" class="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700" @click="cancelPositionEditing">キャンセル</button>
          </div>
          <p v-if="moveStatus" role="status" class="mt-4 text-xs leading-5 text-stone-600">{{ moveStatus }}</p>
        </aside>
      </div>
      <ConfirmDialog :open="unplaceConfirmOpen" title="PIN配置を解除" message="Spot情報とカテゴリーは残したまま、イラスト上の配置を解除します。公開中の場合は下書きへ戻ります。" confirm-label="配置を解除する" destructive @cancel="unplaceConfirmOpen = false" @confirm="unplaceSpot" />
    </template>
  </div>
</template>
