<script setup lang="ts">
import MediaPicker from '~/components/admin/MediaPicker.vue'
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue'
import UiAlertDialog from '~/components/ui/UiAlertDialog.vue'
import SaveFeedback from '~/components/ui/SaveFeedback.vue'
import UnsavedChangesGuard from '~/components/admin/UnsavedChangesGuard.vue'
import type { MapFloorListResponse } from '~~/shared/types/floor'
import type { FloorDecorationItem, FloorDecorationListResponse, FloorDecorationResponse } from '~~/shared/types/decoration'
import type { UploadedImage } from '~~/shared/types/upload'

type DecorationGeometryDraft = Pick<FloorDecorationItem, 'id' | 'x' | 'y' | 'width' | 'rotation'>
type InteractionKind = 'move' | 'resize' | 'rotate'

definePageMeta({ layout: 'admin', middleware: 'auth' })
const route = useRoute()
const mapId = route.params.mapId as string
const floorId = route.params.floorId as string
const [{ data: floorData }, { data }] = await Promise.all([
  useFetch<MapFloorListResponse>(`/api/maps/${mapId}/floors`),
  useFetch<FloorDecorationListResponse>(`/api/maps/${mapId}/floors/${floorId}/decorations`),
])
const floor = computed(() => floorData.value?.floors.find(item => item.id === floorId))
const items = ref<FloorDecorationItem[]>([])
const selectedId = ref<string | null>(null)
const draft = ref<DecorationGeometryDraft | null>(null)
const saveError = ref('')
const saveState = ref<'idle' | 'saving' | 'success' | 'error'>('idle')
const saving = ref(false)
const commandBusy = ref(false)
const transitionOpen = ref(false)
const pickerKey = ref(0)
let pendingAdd = false
let pendingAction: (() => void | Promise<void>) | null = null
const deleteTarget = ref<FloorDecorationItem | null>(null)
const deleting = ref(false)
const { success } = useToast()
let activeCleanup: (() => void) | null = null
let frame = 0

watch(() => data.value?.decorations, (decorations) => {
  if (decorations) items.value = decorations.map(item => ({ ...item }))
}, { immediate: true })

const selected = computed(() => items.value.find(item => item.id === selectedId.value) ?? null)
const dirty = computed(() => {
  const saved = selected.value
  const candidate = draft.value
  return Boolean(saved && candidate && (candidate.x !== saved.x || candidate.y !== saved.y || candidate.width !== saved.width || candidate.rotation !== saved.rotation))
})

function geometry(item: FloorDecorationItem): DecorationGeometryDraft {
  return { id: item.id, x: item.x, y: item.y, width: item.width, rotation: item.rotation }
}

function select(item: FloorDecorationItem) {
  if (selectedId.value === item.id && draft.value) return
  selectedId.value = item.id
  draft.value = geometry(item)
  saveState.value = 'idle'
  saveError.value = ''
}

function discard() {
  if (selected.value) draft.value = geometry(selected.value)
  saveState.value = 'idle'
  saveError.value = ''
}

function requestTransition(action: () => void | Promise<void>) {
  if (saving.value || commandBusy.value) return
  if (!dirty.value) { void action(); return }
  pendingAction = action
  transitionOpen.value = true
}

function stay() {
  transitionOpen.value = false
  pendingAction = null
  if (pendingAdd) { pickerKey.value++; pendingAdd = false }
}
function continueAfterResolution() {
  const action = pendingAction
  transitionOpen.value = false
  pendingAction = null
  pendingAdd = false
  if (action) void action()
}
function discardAndContinue() { discard(); continueAfterResolution() }
async function saveAndContinue() {
  if (!await saveGeometry()) return
  saveState.value = 'idle'
  success('装飾の位置と形を保存しました', 'decoration-save')
  continueAfterResolution()
}

function displayState(item: FloorDecorationItem): FloorDecorationItem {
  return item.id === draft.value?.id ? { ...item, ...draft.value } : item
}

function replaceCanonical(item: FloorDecorationItem) {
  const index = items.value.findIndex(candidate => candidate.id === item.id)
  if (index >= 0) items.value[index] = { ...item }
  else items.value.push({ ...item })
  if (selectedId.value === item.id) draft.value = geometry(item)
}

async function addDecoration(image: UploadedImage) {
  if (saving.value || commandBusy.value) {
    pickerKey.value++
    saveError.value = '処理が終わってから装飾を追加してください。'
    return
  }
  if (dirty.value) { pendingAdd = true; requestTransition(() => addDecoration(image)); return }
  commandBusy.value = true
  saveState.value = 'idle'
  saveError.value = ''
  try {
    const response = await $fetch<FloorDecorationResponse>(`/api/maps/${mapId}/floors/${floorId}/decorations`, { method: 'POST', body: { assetId: image.assetId, x: 0.5, y: 0.5, width: 0.2, rotation: 0 } })
    replaceCanonical(response.decoration)
    select(response.decoration)
    success('装飾を追加しました', 'decoration-save')
  } catch {
    saveError.value = '装飾を追加できませんでした。時間をおいて再度お試しください。'
  } finally { commandBusy.value = false }
}

async function saveGeometry(): Promise<boolean> {
  if (!draft.value || !dirty.value || saving.value || commandBusy.value) return false
  const next = { ...draft.value }
  saving.value = true
  saveState.value = 'saving'
  saveError.value = ''
  try {
    const response = await $fetch<FloorDecorationResponse>(`/api/maps/${mapId}/floors/${floorId}/decorations/${next.id}`, {
      method: 'PATCH',
      body: { x: next.x, y: next.y, width: next.width, rotation: next.rotation },
    })
    replaceCanonical(response.decoration)
    saveState.value = 'success'
    return true
  } catch {
    saveState.value = 'error'
    saveError.value = '装飾を保存できませんでした。変更は保持しています。再試行できます。'
    return false
  } finally { saving.value = false }
}

function normalizedRotation(value: number) {
  return ((value + 180) % 360 + 360) % 360 - 180
}

function clampedCenter(nextX: number, nextY: number, width: number, rotation: number, item: FloorDecorationItem) {
  if (!floor.value) return { x: nextX, y: nextY }
  const height = width * (item.imageHeight / item.imageWidth) * (floor.value.imageWidth / floor.value.imageHeight)
  const radians = rotation * Math.PI / 180
  const halfX = Math.abs(Math.cos(radians)) * width / 2 + Math.abs(Math.sin(radians)) * height / 2
  const halfY = Math.abs(Math.sin(radians)) * width / 2 + Math.abs(Math.cos(radians)) * height / 2
  return {
    x: Math.min(1 - Math.min(0.5, halfX), Math.max(Math.min(0.5, halfX), nextX)),
    y: Math.min(1 - Math.min(0.5, halfY), Math.max(Math.min(0.5, halfY), nextY)),
  }
}

function startInteraction(event: PointerEvent, item: FloorDecorationItem, kind: InteractionKind) {
  if (event.button !== 0 || saving.value || commandBusy.value) return
  if (selectedId.value !== item.id && dirty.value) { requestTransition(() => select(item)); return }
  activeCleanup?.()
  select(item)
  const start = { ...draft.value! }
  const surface = (event.currentTarget as HTMLElement).closest('[data-decoration-surface]') as HTMLElement | null
  if (!surface) return
  const bounds = surface.getBoundingClientRect()
  const centerX = bounds.left + start.x * bounds.width
  const centerY = bounds.top + start.y * bounds.height
  const startPointerX = event.clientX
  const startPointerY = event.clientY
  const startDistance = Math.max(1, Math.hypot(startPointerX - centerX, startPointerY - centerY))
  const startAngle = Math.atan2(startPointerY - centerY, startPointerX - centerX)
  const captureTarget = event.currentTarget as HTMLElement
  captureTarget.setPointerCapture?.(event.pointerId)
  let latest = event

  const render = () => {
    frame = 0
    const next = { ...start }
    if (kind === 'move') {
      const dx = (latest.clientX - startPointerX) / bounds.width
      const dy = (latest.clientY - startPointerY) / bounds.height
      Object.assign(next, clampedCenter(start.x + dx, start.y + dy, start.width, start.rotation, item))
    } else if (kind === 'resize') {
      const distance = Math.hypot(latest.clientX - centerX, latest.clientY - centerY)
      next.width = Math.min(1, Math.max(0.03, start.width * distance / startDistance))
      Object.assign(next, clampedCenter(next.x, next.y, next.width, next.rotation, item))
    } else {
      const angle = Math.atan2(latest.clientY - centerY, latest.clientX - centerX)
      next.rotation = normalizedRotation(start.rotation + (angle - startAngle) * 180 / Math.PI)
    }
    draft.value = next
  }
  const move = (nextEvent: PointerEvent) => {
    if (nextEvent.pointerId !== event.pointerId) return
    latest = nextEvent
    if (!frame) frame = requestAnimationFrame(render)
  }
  const cleanup = () => {
    if (frame) cancelAnimationFrame(frame)
    frame = 0
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', end)
    window.removeEventListener('pointercancel', cancel)
    if (activeCleanup === cleanup) activeCleanup = null
  }
  const end = (endEvent: PointerEvent) => {
    if (endEvent.pointerId !== event.pointerId) return
    if (frame) render()
    cleanup()
  }
  const cancel = (cancelEvent: PointerEvent) => {
    if (cancelEvent.pointerId !== event.pointerId) return
    cleanup()
    draft.value = start
  }
  activeCleanup = cleanup
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', end)
  window.addEventListener('pointercancel', cancel)
}

function onKeyboard(event: KeyboardEvent, item: FloorDecorationItem, kind: InteractionKind) {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
  event.preventDefault()
  if (saving.value || commandBusy.value) return
  if (selectedId.value !== item.id && dirty.value) { requestTransition(() => select(item)); return }
  select(item)
  const next = { ...draft.value! }
  const direction = ['ArrowLeft', 'ArrowDown'].includes(event.key) ? -1 : 1
  const amount = event.shiftKey ? 0.05 : 0.01
  if (kind === 'move') {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') next.x += amount * direction
    else next.y += amount * direction
    Object.assign(next, clampedCenter(next.x, next.y, next.width, next.rotation, item))
  } else if (kind === 'resize') {
    next.width = Math.min(1, Math.max(0.03, next.width + amount * direction))
    Object.assign(next, clampedCenter(next.x, next.y, next.width, next.rotation, item))
  } else next.rotation = normalizedRotation(next.rotation + (event.shiftKey ? 15 : 1) * direction)
  draft.value = next
}

async function duplicate(item: FloorDecorationItem) {
  if (dirty.value) { requestTransition(() => duplicate(item)); return }
  if (commandBusy.value) return
  item = items.value.find(candidate => candidate.id === item.id) ?? item
  commandBusy.value = true
  saveState.value = 'idle'
  saveError.value = ''
  try {
    const response = await $fetch<FloorDecorationResponse>(`/api/maps/${mapId}/floors/${floorId}/decorations`, { method: 'POST', body: { assetId: item.assetId, x: Math.min(1, item.x + 0.03), y: Math.min(1, item.y + 0.03), width: item.width, rotation: item.rotation } })
    replaceCanonical(response.decoration)
    select(response.decoration)
    success('装飾を複製しました', 'decoration-save')
  } catch {
    saveError.value = '装飾を複製できませんでした。'
  } finally { commandBusy.value = false }
}

function requestDelete(item: FloorDecorationItem) {
  requestTransition(() => { deleteTarget.value = item })
}

async function removeConfirmed() {
  if (!deleteTarget.value || deleting.value || commandBusy.value) return
  deleting.value = true
  saveError.value = ''
  try {
    const targetId = deleteTarget.value.id
    await $fetch(`/api/maps/${mapId}/floors/${floorId}/decorations/${targetId}`, { method: 'DELETE' })
    items.value = items.value.filter(item => item.id !== targetId)
    selectedId.value = null
    draft.value = null
    deleteTarget.value = null
    success('装飾を削除しました', 'decoration-save')
  } catch {
    saveError.value = '装飾を削除できませんでした。'
  } finally {
    deleting.value = false
  }
}

async function moveLayer(item: FloorDecorationItem, delta: number) {
  if (dirty.value) { requestTransition(() => moveLayer(item, delta)); return }
  if (commandBusy.value) return
  item = items.value.find(candidate => candidate.id === item.id) ?? item
  commandBusy.value = true
  saveState.value = 'idle'
  saveError.value = ''
  try {
    const response = await $fetch<FloorDecorationResponse>(`/api/maps/${mapId}/floors/${floorId}/decorations/${item.id}`, { method: 'PATCH', body: { order: Math.max(0, item.order + delta) } })
    replaceCanonical(response.decoration)
    success('並び順を変更しました', 'decoration-save')
  } catch {
    saveError.value = '並び順を変更できませんでした。'
  } finally { commandBusy.value = false }
}

function clearSelection() { requestTransition(() => { selectedId.value = null; draft.value = null; saveState.value = 'idle'; saveError.value = '' }) }

onBeforeUnmount(() => activeCleanup?.())
</script>

<template>
  <div class="max-w-6xl">
    <NuxtLink :to="`/admin/maps/${mapId}/floors`" class="text-sm font-semibold text-stone-600">← フロア管理に戻る</NuxtLink>
    <h1 class="mt-5 text-3xl font-bold">{{ floor?.name }}の装飾</h1>
    <p class="mt-2 text-sm text-stone-600">装飾を選び、画像をドラッグして移動します。角のハンドルでサイズ、上のハンドルで角度を調整できます。</p>
    <div class="mt-7 grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div
        v-if="floor"
        data-decoration-surface
        class="relative select-none overflow-hidden rounded-xl border bg-stone-100 touch-none"
        :style="{ aspectRatio: `${floor.imageWidth}/${floor.imageHeight}` }"
        @pointerdown.self="clearSelection"
      >
        <img :src="floor.illustrationUrl" alt="" class="pointer-events-none absolute inset-0 size-full object-contain">
        <div
          v-for="item in items"
          :key="item.id"
          class="absolute z-10 -translate-x-1/2 -translate-y-1/2"
          :style="{ left: `${displayState(item).x * 100}%`, top: `${displayState(item).y * 100}%`, width: `${displayState(item).width * 100}%`, transform: `translate(-50%, -50%) rotate(${displayState(item).rotation}deg)`, zIndex: displayState(item).order + 1 }"
        >
          <button
            type="button"
            class="dm-field-focus block w-full cursor-move rounded-sm border-0 bg-transparent p-0 touch-none"
            :class="item.id === selectedId ? 'outline outline-2 outline-offset-2 outline-terracotta-600' : ''"
            :aria-label="`${floor.name}の装飾を移動`"
            @pointerdown.prevent.stop="startInteraction($event, item, 'move')"
            @keydown="onKeyboard($event, item, 'move')"
          >
            <img :src="item.imageUrl" alt="" draggable="false" class="pointer-events-none block h-auto w-full object-contain">
          </button>
          <template v-if="item.id === selectedId">
            <button
              type="button"
              aria-label="装飾のサイズを変更"
              class="dm-field-focus absolute -bottom-4 -right-4 z-20 flex size-11 cursor-nwse-resize items-center justify-center rounded-full border-2 border-white bg-terracotta-600 text-white shadow touch-none"
              @pointerdown.prevent.stop="startInteraction($event, item, 'resize')"
              @keydown="onKeyboard($event, item, 'resize')"
            >↘</button>
            <span aria-hidden="true" class="absolute bottom-full left-1/2 h-7 w-px -translate-x-1/2 bg-terracotta-600" />
            <button
              type="button"
              aria-label="装飾を回転"
              class="dm-field-focus absolute bottom-[calc(100%+1.5rem)] left-1/2 z-20 flex size-11 -translate-x-1/2 cursor-grab items-center justify-center rounded-full border-2 border-white bg-terracotta-600 text-white shadow touch-none"
              @pointerdown.prevent.stop="startInteraction($event, item, 'rotate')"
              @keydown="onKeyboard($event, item, 'rotate')"
            >↻</button>
          </template>
        </div>
      </div>
      <aside class="space-y-5">
        <MediaPicker :key="pickerKey" :map-id="mapId" label="装飾画像" usage="decoration" @selected="addDecoration" />
        <section v-if="selected" class="rounded-xl border bg-white p-4">
          <h2 class="font-bold">選択中の装飾</h2>
          <p class="mt-2 text-sm text-stone-600">ドラッグ、角のハンドル、または矢印キーで位置と形を調整します。</p>
          <p v-if="dirty" class="mt-3 text-sm font-semibold text-terracotta-700">保存していない位置・形の変更があります。</p>
          <div class="mt-4 flex flex-wrap gap-2 border-b pb-4">
            <button type="button" class="min-h-11 rounded-lg border px-4 text-sm font-semibold disabled:opacity-50" :disabled="!dirty || saving || commandBusy" @click="discard">変更を破棄</button>
            <button type="button" class="min-h-11 rounded-lg bg-terracotta-600 px-4 text-sm font-semibold text-white disabled:opacity-50" :disabled="!dirty || saving || commandBusy" @click="saveGeometry">{{ saving ? '保存中…' : '保存' }}</button>
          </div>
          <SaveFeedback class="mt-3" :state="saveState" :message="saveError || (saveState === 'success' ? '装飾の位置と形を保存しました。' : '')" />
          <h3 class="mt-4 text-sm font-bold">装飾の操作</h3>
          <div class="mt-4 grid grid-cols-2 gap-2">
            <button type="button" class="min-h-11 rounded border p-2 text-sm disabled:opacity-50" :disabled="saving || commandBusy" @click="moveLayer(selected, -1)">後ろへ</button>
            <button type="button" class="min-h-11 rounded border p-2 text-sm disabled:opacity-50" :disabled="saving || commandBusy" @click="moveLayer(selected, 1)">前へ</button>
            <button type="button" class="min-h-11 rounded border p-2 text-sm disabled:opacity-50" :disabled="saving || commandBusy" @click="duplicate(selected)">複製</button>
            <button type="button" class="min-h-11 rounded border border-red-200 p-2 text-sm text-red-700 disabled:opacity-50" :disabled="saving || commandBusy" @click="requestDelete(selected)">削除</button>
          </div>
        </section>
        <p v-if="saveError && saveState !== 'error'" role="alert" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ saveError }}</p>
      </aside>
    </div>
    <ConfirmDialog
      :open="Boolean(deleteTarget)"
      title="装飾を削除"
      message="この装飾をフロアから削除します。この操作は取り消せません。元のメディア画像は削除されません。"
      confirm-label="削除する"
      destructive
      :busy="deleting"
      @cancel="deleteTarget = null"
      @confirm="removeConfirmed"
    />
    <UiAlertDialog :open="transitionOpen" title="未保存の変更があります" message="位置と形の変更を保存して続けるか、破棄して続けるか選んでください。" confirm-label="保存して続ける" secondary-label="破棄して続ける" cancel-label="編集を続ける" :busy="saving" @confirm="saveAndContinue" @secondary="discardAndContinue" @cancel="stay" />
    <UnsavedChangesGuard :dirty="dirty && !saving" />
  </div>
</template>
