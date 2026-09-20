<script setup lang="ts">
import SaveFeedback from '~/components/ui/SaveFeedback.vue'
import SpotCombobox from '~/components/admin/SpotCombobox.vue'
import PinDesignEditor from '~/components/admin/PinDesignEditor.vue'
import UnsavedChangesGuard from '~/components/admin/UnsavedChangesGuard.vue'
import { defineAsyncComponent } from 'vue'
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue'
import { resolveMapEditorReturnContext } from '~/utils/map-editor-camera'
import { createLatestRequestGate } from '~/utils/latest-request'
import { applySelectedPinDesignDraft, isPositionEditing, needsPinEditorDiscardConfirmation, toPositionUpdatePayload, type PinEditorMode } from '~/utils/pin-editor-state'
import { createPinEditorOperationGate, type PinEditorOperationContext } from '~/utils/pin-editor-operation'
import { isGeoReferenced, type ImagePosition } from '~~/lib/geo'
import { getAddressPlacementCandidate } from '~~/lib/address-placement'
import type { GeocodeResponse, GeocodeResult } from '~~/shared/types/geocode'
import type { MapFloorListResponse } from '~~/shared/types/floor'
import type { MapViewerCameraState, MapViewerSpot } from '~~/shared/types/map-viewer'
import type { AdminSpotListResponse, AdminSpotSummary, PositionedAdminSpotSummary, SpotPinDesignResponse, SpotPositionResponse } from '~~/shared/types/spot'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const LazyMapViewer = defineAsyncComponent(() => import('~/components/map/MapViewer.vue'))
const mapViewerRef = useTemplateRef<{ focusSpot: (spotId: string) => boolean }>('mapViewer')
const pinDesignEditorRef = useTemplateRef<{
  isDirty: () => boolean
  reset: () => void
  save: () => Promise<SpotPinDesignResponse['design'] | null>
}>('pinDesignEditor')

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
const floorOptions = computed(() => data.value?.floors.map(floor => ({ value: floor.id, label: floor.name })) ?? [])
const selectedFloorSpots = computed(() => spotData.value?.spots.filter(spot => spot.floorId === selectedFloorId.value) ?? [])
const positionedFloorSpots = computed(() => selectedFloorSpots.value.filter(hasPosition))
const unpositionedFloorSpots = computed(() => selectedFloorSpots.value.filter(spot => !hasPosition(spot)))
const placementSpotId = ref(requestedPlacementSpotId)
const placementSpot = computed(() => selectedFloorSpots.value.find(spot => spot.id === placementSpotId.value) ?? null)
const placementSpotIsPositioned = computed(() => Boolean(placementSpot.value && hasPosition(placementSpot.value)))
const placementMode = ref<PinEditorMode>('idle')
const placementActive = computed(() => isPositionEditing(placementMode.value))
const designEditing = computed(() => placementMode.value === 'designing')
const candidateKind = computed(() => placementMode.value === 'moving' ? 'move' : placementMode.value === 'placing' ? 'placement' : null)
const pendingPinDesign = ref<SpotPinDesignResponse['design'] | null>(null)
const mapSpots = computed(() => applySelectedPinDesignDraft(positionedFloorSpots.value, placementSpotId.value, placementMode.value, pendingPinDesign.value))
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
const discardConfirmOpen = ref(false)
let pendingTransition: (() => void) | null = null
const addressCandidates = ref<GeocodeResult[]>([])
const addressSearchStatus = ref('')
const isSearchingAddress = ref(false)
const addressRequestGate = createLatestRequestGate()
const positionSaving = ref(false)
const unplacing = ref(false)
const operationGate = createPinEditorOperationGate(() => ({
  spotId: placementSpotId.value,
  floorId: selectedFloorId.value,
  mode: placementMode.value,
}))

watch(() => data.value?.floors, (floors) => {
  if (floors?.length && !floors.some(floor => floor.id === selectedFloorId.value)) {
    selectedFloorId.value = floors[0]?.id ?? ''
  }
}, { immediate: true })

watch(selectedFloorId, () => {
  operationGate.invalidate()
  addressRequestGate.invalidate()
  isSearchingAddress.value = false
  position.value = null
  placementMode.value = 'idle'
  placementSpotId.value = ''
  pendingPinDesign.value = null
  addressCandidates.value = []
  addressSearchStatus.value = ''
  moveStatus.value = ''
})

watch(placementSpotId, () => {
  operationGate.invalidate()
  addressRequestGate.invalidate()
  isSearchingAddress.value = false
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
  moveStatus.value = '移動モードです。ピンをドラッグするか、地図をクリックしてください。'
}

function startDesignEditing() {
  if (!placementSpot.value) return
  position.value = null
  placementMode.value = 'designing'
  moveStatus.value = 'ピンデザインの変更は、保存するまでこの地図だけに表示されます。'
}

function hasPendingChanges() {
  return needsPinEditorDiscardConfirmation(placementMode.value, position.value, pinDesignEditorRef.value?.isDirty() ?? false)
}

const pageDirty = computed(() => Boolean(
  position.value
  || (designEditing.value && placementSpot.value && pendingPinDesign.value
    && JSON.stringify(pendingPinDesign.value) !== JSON.stringify({
      pinIconType: placementSpot.value.pinIconType,
      pinIconId: placementSpot.value.pinIconId,
      pinIconImageUrl: placementSpot.value.pinIconImageUrl,
      pinIconAssetId: placementSpot.value.pinIconAssetId,
      pinColor: placementSpot.value.pinColor,
      pinSize: placementSpot.value.pinSize,
      importance: placementSpot.value.importance,
    }))
))

function requestTransition(action: () => void) {
  if (!hasPendingChanges()) {
    action()
    return
  }
  pendingTransition = action
  discardConfirmOpen.value = true
}

function keepEditing() {
  pendingTransition = null
  discardConfirmOpen.value = false
}

function discardAndContinue() {
  pinDesignEditorRef.value?.reset()
  position.value = null
  placementMode.value = 'idle'
  discardConfirmOpen.value = false
  const action = pendingTransition
  pendingTransition = null
  action?.()
}

async function finishSuccessfulSave(message: string, operation: PinEditorOperationContext) {
  await refreshSpots()
  if (!operationGate.isCurrent(operation)) return
  position.value = null
  placementMode.value = 'idle'
  pendingPinDesign.value = null
  placementSpotId.value = ''
  moveStatus.value = message
  await navigateTo({ path: route.path, query: { floorId: selectedFloorId.value } }, { replace: true })
}

async function savePosition() {
  if (!placementSpot.value || !position.value || positionSaving.value) return
  const operation = operationGate.begin()
  positionSaving.value = true
  moveStatus.value = '位置を保存しています…'
  try {
    await $fetch<SpotPositionResponse>(`/api/maps/${mapId}/spots/${placementSpot.value.id}/position`, {
      method: 'PATCH',
      body: toPositionUpdatePayload(position.value),
    })
    await finishSuccessfulSave('スポットの位置を保存しました。', operation)
  }
  catch {
    if (operationGate.isCurrent(operation)) moveStatus.value = '位置を保存できませんでした。'
  }
  finally {
    positionSaving.value = false
  }
}

async function saveDesign() {
  if (!placementSpot.value || !designEditing.value) return
  const operation = operationGate.begin()
  moveStatus.value = 'ピンデザインを保存しています…'
  const savedDesign = await pinDesignEditorRef.value?.save()
  if (!savedDesign) {
    if (operationGate.isCurrent(operation)) moveStatus.value = 'ピンデザインを保存できませんでした。入力内容を保持しています。'
    return
  }
  if (!operationGate.isCurrent(operation)) {
    await refreshSpots()
    return
  }
  pendingPinDesign.value = savedDesign
  await finishSuccessfulSave('ピンデザインを保存しました。', operation)
}

function cancelPositionEditing() {
  position.value = null
  placementMode.value = 'idle'
  moveStatus.value = '位置の変更をキャンセルしました。保存済みの位置は変更していません。'
}

function cancelDesignEditing() {
  pinDesignEditorRef.value?.reset()
  pendingPinDesign.value = placementSpot.value
    ? {
        pinIconType: placementSpot.value.pinIconType,
        pinIconId: placementSpot.value.pinIconId,
        pinIconImageUrl: placementSpot.value.pinIconImageUrl,
        pinIconAssetId: placementSpot.value.pinIconAssetId,
        pinColor: placementSpot.value.pinColor,
        pinSize: placementSpot.value.pinSize,
        importance: placementSpot.value.importance,
      }
    : null
  placementMode.value = 'idle'
  moveStatus.value = 'ピンデザインの変更をキャンセルしました。保存済みのデザインへ戻しました。'
}

async function unplaceSpot() {
  const spot = placementSpot.value
  if (!spot || unplacing.value) return
  const operation = operationGate.begin()
  unplacing.value = true
  moveStatus.value = 'ピン配置を解除しています…'
  try {
    await $fetch<SpotPositionResponse>(`/api/maps/${mapId}/spots/${spot.id}/position`, { method: 'DELETE' })
    if (operationGate.isCurrent(operation)) unplaceConfirmOpen.value = false
    await finishSuccessfulSave('ピン配置を解除しました。公開中だった場合は下書きへ戻しました。', operation)
  }
  catch {
    if (operationGate.isCurrent(operation)) moveStatus.value = 'ピン配置を解除できませんでした。'
  }
  finally {
    unplacing.value = false
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
  const floorIdAtRequest = selectedFloor.value.id
  const request = addressRequestGate.begin()
  isSearchingAddress.value = true
  addressCandidates.value = []
  addressSearchStatus.value = '住所を検索しています…'
  try {
    const response = await $fetch<GeocodeResponse>('/api/geocode', { query: { q: spot.address } })
    if (!addressRequestGate.isCurrent(request) || placementSpotId.value !== spot.id || selectedFloorId.value !== floorIdAtRequest || !placementActive.value) return
    addressCandidates.value = response.results
    addressSearchStatus.value = response.results.length
      ? '候補を選んで地図上の仮位置を確認してください。'
      : '候補が見つかりませんでした。地図上で手動配置できます。'
  }
  catch {
    if (!addressRequestGate.isCurrent(request)) return
    addressSearchStatus.value = '住所を検索できませんでした。地図上で手動配置できます。'
  }
  finally {
    if (addressRequestGate.isCurrent(request)) isSearchingAddress.value = false
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
  if (spot.id === placementSpotId.value) return
  requestTransition(() => {
    placementSpotId.value = spot.id
    position.value = null
    placementMode.value = 'idle'
    moveStatus.value = ''
  })
}

function selectPositionedSpot(spotId: string) {
  const spot = positionedFloorSpots.value.find(item => item.id === spotId)
  if (!spot) return
  requestTransition(() => {
    placementSpotId.value = spot.id
    position.value = null
    placementMode.value = 'idle'
    moveStatus.value = ''
    nextTick(() => mapViewerRef.value?.focusSpot(spotId))
  })
}

function selectUnpositionedSpot(spotId: string) {
  if (!spotId) return
  requestTransition(() => {
    placementSpotId.value = spotId
    position.value = null
    placementMode.value = 'idle'
    moveStatus.value = ''
  })
}

function selectFloor(floorId: string) {
  if (floorId === selectedFloorId.value) return
  requestTransition(() => { selectedFloorId.value = floorId })
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
  if (event.key !== 'Escape' || unplaceConfirmOpen.value || discardConfirmOpen.value) return
  if (placementActive.value) requestTransition(cancelPositionEditing)
  else if (designEditing.value) requestTransition(cancelDesignEditing)
}

onMounted(() => window.addEventListener('keydown', handleEscape))
onBeforeUnmount(() => {
  addressRequestGate.invalidate()
  window.removeEventListener('keydown', handleEscape)
})
</script>

<template>
  <div class="max-w-7xl">
    <AdminSubnavigation :map-id="mapId" area="map-edit" />
    <NuxtLink :to="`/admin/maps/${mapId}/spots`" class="text-sm font-medium text-stone-600 hover:text-stone-900">← スポット一覧に戻る</NuxtLink>
    <header class="mt-5">
      <h1 class="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-2xl">ピン配置</h1>
      <p class="mt-1 text-sm text-stone-600">フロアイラスト上でピンを選択し、位置とデザインを分けて編集します。</p>
    </header>

    <div v-if="status === 'pending'" class="mt-8 rounded-xl bg-white p-8 text-sm text-stone-600">読み込んでいます…</div>
    <div v-else-if="error" class="mt-8 rounded-xl bg-red-50 p-8 text-sm text-red-700">フロアを読み込めませんでした。</div>
    <div v-else-if="!data?.floors.length" class="mt-8 rounded-xl bg-amber-50 p-8 text-sm text-amber-800">先にフロアを1件以上登録してください。</div>
    <template v-else-if="selectedFloor">
      <div data-pin-editor-toolbar class="mt-6 grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(12rem,1fr)] sm:items-end">
        <div class="min-w-0">
          <SpotCombobox
            v-model="positionedSearchSpotId"
            :spots="positionedFloorSpots"
            label="配置済みスポットを検索"
            input-id="positioned-spot-search"
            placeholder="スポット名・カテゴリー・フロアで検索"
            empty-message="該当する配置済みスポットはありません。"
          />
        </div>
        <div class="min-w-0">
          <label class="mb-1.5 block text-xs font-semibold text-stone-600" for="pin-editor-floor-select">フロア選択</label>
          <UiSelect
            id="pin-editor-floor-select"
            :model-value="selectedFloorId"
            :options="floorOptions"
            label="編集フロアを選択"
            @update:model-value="selectFloor"
          />
        </div>
      </div>
      <div data-pin-editor-workspace class="mt-3 grid min-h-0 items-stretch gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)] xl:grid-cols-[minmax(0,7fr)_minmax(380px,3fr)]">
        <section class="min-w-0" aria-label="地図操作">
          <ClientOnly>
            <LazyMapViewer
              ref="mapViewer"
              v-model="position"
              :floor="selectedFloor"
              :spots="mapSpots"
              mode="edit"
              :selected-spot-id="placementSpotId || null"
              :candidate-spot="candidateSpot"
              :candidate-kind="candidateKind"
              :placement-enabled="placementActive"
              height="min(68vh, 46rem)"
              label="ピン配置地図"
              :initial-camera="initialCamera"
              @camera-changed="handleCameraChanged"
              @spot-moved="updateCandidateFromDrag"
              @spot-selected="selectExistingSpot"
            />
            <template #fallback><div class="h-[38rem] animate-pulse rounded-xl bg-stone-100" /></template>
          </ClientOnly>
        </section>
        <UiInspector class="overflow-hidden rounded-xl border border-stone-200" :title="designEditing ? 'ピンデザインを編集' : placementActive ? 'ピン位置を編集' : '詳細設定'">
          <SaveFeedback v-if="route.query.saved === 'spot-created'" class="mt-3" state="success" message="スポットを登録しました。" />
          <SpotCombobox v-if="placementMode === 'idle'" :model-value="placementSpotIsPositioned ? '' : placementSpotId" :spots="unpositionedFloorSpots" @update:model-value="selectUnpositionedSpot" />

          <section class="mt-6 border-t border-stone-200 pt-5" aria-live="polite">
            <h2 class="text-sm font-bold text-stone-900">{{ placementMode === 'idle' ? '選択中のスポット' : '編集中のスポット' }}</h2>
            <p v-if="!placementSpot" class="mt-3 text-sm text-stone-600">地図上のピンを選択してください。</p>
            <template v-else>
              <h3 class="mt-3 text-lg font-bold text-stone-900">{{ placementSpot.name }}</h3>
              <p class="mt-1 text-xs text-stone-500">{{ placementSpot.floorName }}<span v-if="placementSpot.categories.length"> / {{ placementSpot.categories.map(category => category.name).join('・') }}</span></p>
              <div v-if="placementMode === 'idle'" class="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span class="rounded-full bg-stone-100 px-2.5 py-1 text-stone-700">{{ placementSpotIsPositioned ? '配置済み' : '未配置' }}</span>
                <span class="rounded-full px-2.5 py-1" :class="placementSpot.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'">{{ placementSpot.isPublished ? '公開中' : '下書き' }}</span>
                <span class="rounded-full bg-stone-100 px-2.5 py-1 text-stone-700">サイズ: {{ ({ small: '小', medium: '中', large: '大' })[placementSpot.pinSize] }}</span>
                <span class="rounded-full bg-stone-100 px-2.5 py-1 text-stone-700">{{ placementSpot.importance === 'featured' ? '注目ピン' : '通常ピン' }}</span>
              </div>
              <template v-if="placementMode === 'idle'">
                <NuxtLink :to="`/admin/maps/${mapId}/spots/${placementSpot.id}`" class="mt-3 inline-flex text-sm font-semibold text-terracotta-700">スポット詳細を開く</NuxtLink>
                <div class="mt-4 grid gap-2 sm:grid-cols-2">
                  <button type="button" class="rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white" @click="placementSpotIsPositioned ? startMoving() : startPlacement()">{{ placementSpotIsPositioned ? '位置を移動' : '位置を設定' }}</button>
                  <button type="button" class="rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50" @click="startDesignEditing">デザインを編集</button>
                  <button v-if="placementSpotIsPositioned" type="button" class="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 sm:col-span-2" @click="unplaceConfirmOpen = true">配置を解除</button>
                </div>
              </template>

              <div v-else-if="designEditing" class="mt-5 border-t border-stone-200 pt-4">
                <PinDesignEditor
                  ref="pinDesignEditor"
                  :key="placementSpot.id"
                  :map-id="mapId"
                  :spot-id="placementSpot.id"
                  :initial-value="placementSpot"
                  compact
                  :show-save="false"
                  :guard-navigation="false"
                  @changed="handlePinDesignChanged"
                  @updated="updatePinDesign"
                />
              </div>
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
            {{ placementMode === 'moving' ? (position ? '移動先を確認し、保存してください。' : '元のピンは薄く表示されています。地図をクリックして移動先を仮配置してください。') : (position ? '仮配置を確認し、保存してください。' : '地図をクリックして仮配置してください。') }}
          </div>
          <template v-if="designEditing || placementActive" #footer>
            <p v-if="moveStatus" role="status" class="mb-3 text-xs leading-5 text-stone-600">{{ moveStatus }}</p>
            <UiFormActions>
              <UiButton variant="secondary" :disabled="positionSaving" @click="requestTransition(designEditing ? cancelDesignEditing : cancelPositionEditing)">キャンセル</UiButton>
              <UiButton v-if="designEditing" @click="saveDesign">デザインを保存</UiButton>
              <UiButton v-else :busy="positionSaving" :disabled="!position || positionSaving" @click="savePosition">{{ positionSaving ? '保存中…' : 'この位置を保存' }}</UiButton>
            </UiFormActions>
          </template>
        </UiInspector>
      </div>
      <ConfirmDialog :open="unplaceConfirmOpen" title="ピン配置を解除" message="スポット情報とカテゴリーは残したまま、イラスト上の配置を解除します。公開中の場合は下書きへ戻ります。" confirm-label="配置を解除する" destructive :busy="unplacing" @cancel="unplaceConfirmOpen = false" @confirm="unplaceSpot" />
      <ConfirmDialog :open="discardConfirmOpen" title="未保存の変更があります" message="保存していない位置またはピンデザインの変更を破棄して切り替えますか？" confirm-label="変更を破棄" cancel-label="編集を続ける" destructive @cancel="keepEditing" @confirm="discardAndContinue" />
      <UnsavedChangesGuard :dirty="pageDirty" />
    </template>
  </div>
</template>
