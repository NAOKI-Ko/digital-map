<script setup lang="ts">
import SaveFeedback from '~/components/ui/SaveFeedback.vue'
import MediaPicker from '~/components/admin/MediaPicker.vue'
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue'
import { isGeoReferenced } from '~~/lib/geo'
import type { FloorCreateInput, FloorUpdateInput } from '~~/shared/schemas/floor'
import { floorCreateSchema, floorUpdateSchema } from '~~/shared/schemas/floor'
import type { MapFloorItem, MapFloorListResponse, MapFloorResponse } from '~~/shared/types/floor'
import type { AdminMapResponse } from '~~/shared/types/map'
import type { UploadedImage } from '~~/shared/types/upload'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const route = useRoute()
const mapId = route.params.mapId as string
const { data: mapData } = await useFetch<AdminMapResponse>(`/api/maps/${mapId}`)
const { data, error, status } = await useFetch<MapFloorListResponse>(`/api/maps/${mapId}/floors`)
const createInput = reactive<FloorCreateInput>({
  name: '',
  illustrationUrl: '',
  imageWidth: 0,
  imageHeight: 0,
})
const createError = ref('')
const createPickerRevision = ref(0)
const isCreating = ref(false)
const busyFloorId = ref('')
const operationError = ref('')
const saveMessage = ref('')
const saveState = ref<'idle' | 'saving' | 'success' | 'error'>('idle')
const deleteTarget = ref<MapFloorItem | null>(null)
const deleteMessage = computed(() => {
  const floor = deleteTarget.value
  if (!floor) return ''
  return floor.spotCount > 0
    ? `「${floor.name}」と登録済みスポット${floor.spotCount}件を削除します。関連する写真やカテゴリー設定も登録から外れ、元に戻せません。`
    : `「${floor.name}」を削除します。元に戻せません。`
})

function isFloorGeoreferenced(floor: MapFloorItem) {
  return isGeoReferenced(floor)
}

useHead(() => ({
  title: `フロア管理 - ${mapData.value?.map.name ?? 'マップ'} | デジタルマップ`,
}))

function useUploadedImage(image: UploadedImage) {
  createInput.illustrationUrl = image.url
  createInput.imageWidth = image.width
  createInput.imageHeight = image.height
  createInput.illustrationAssetId = image.assetId
  createError.value = ''
}

async function replaceFloorImage(floor: MapFloorItem, image: UploadedImage) {
  busyFloorId.value = floor.id
  operationError.value = ''
  saveMessage.value = ''
  saveState.value = 'saving'
  try {
    const response = await $fetch<MapFloorResponse>(`/api/maps/${mapId}/floors/${floor.id}`, {
      method: 'PATCH',
      body: { name: floor.name, illustrationUrl: image.url, illustrationAssetId: image.assetId, imageWidth: image.width, imageHeight: image.height },
    })
    if (data.value) data.value = { floors: data.value.floors.map(item => item.id === floor.id ? response.floor : item) }
    saveMessage.value = 'フロア画像を差し替えました。'
    saveState.value = 'success'
  }
  catch {
    operationError.value = 'フロア画像を差し替えできませんでした。もう一度お試しください。'
    saveMessage.value = operationError.value
    saveState.value = 'error'
  }
  finally { busyFloorId.value = '' }
}

async function createFloor() {
  const result = floorCreateSchema.safeParse(createInput)
  if (!result.success) {
    createError.value = result.error.issues[0]?.message ?? '入力内容を確認してください。'
    return
  }

  isCreating.value = true
  createError.value = ''
  saveMessage.value = ''
  saveState.value = 'saving'
  try {
    const response = await $fetch<MapFloorResponse>(`/api/maps/${mapId}/floors`, {
      method: 'POST',
      body: result.data,
    })
    if (data.value) {
      data.value = { floors: [...data.value.floors, response.floor] }
    }
    Object.assign(createInput, {
      name: '',
      illustrationUrl: '',
      imageWidth: 0,
      imageHeight: 0,
      illustrationAssetId: undefined,
    })
    createPickerRevision.value += 1
    saveMessage.value = 'フロアを追加しました。'
    saveState.value = 'success'
  }
  catch {
    createError.value = 'フロアを追加できませんでした。もう一度お試しください。'
    saveMessage.value = createError.value
    saveState.value = 'error'
  }
  finally {
    isCreating.value = false
  }
}

async function updateFloor(floor: MapFloorItem) {
  const input: FloorUpdateInput = { name: floor.name }
  const result = floorUpdateSchema.safeParse(input)
  if (!result.success) {
    operationError.value = result.error.issues[0]?.message ?? '入力内容を確認してください。'
    return
  }

  busyFloorId.value = floor.id
  operationError.value = ''
  saveMessage.value = ''
  saveState.value = 'saving'
  try {
    const response = await $fetch<MapFloorResponse>(`/api/maps/${mapId}/floors/${floor.id}`, {
      method: 'PATCH',
      body: result.data,
    })
    if (data.value) {
      data.value = {
        floors: data.value.floors.map(item => item.id === floor.id ? response.floor : item),
      }
    }
    saveMessage.value = 'フロア名を保存しました。'
    saveState.value = 'success'
  }
  catch {
    operationError.value = 'フロアを保存できませんでした。もう一度お試しください。'
    saveMessage.value = operationError.value
    saveState.value = 'error'
  }
  finally {
    busyFloorId.value = ''
  }
}

async function moveFloor(index: number, direction: -1 | 1) {
  if (!data.value) return
  const target = index + direction
  if (target < 0 || target >= data.value.floors.length) return

  const previousFloors = [...data.value.floors]
  const reordered = [...previousFloors]
  const [moved] = reordered.splice(index, 1)
  if (!moved) return
  reordered.splice(target, 0, moved)
  data.value = {
    floors: reordered.map((floor, order) => ({ ...floor, order })),
  }

  try {
    operationError.value = ''
    saveMessage.value = ''
    saveState.value = 'saving'
    await $fetch(`/api/maps/${mapId}/floors/reorder`, {
      method: 'PATCH',
      body: { floorIds: reordered.map(floor => floor.id) },
    })
    saveMessage.value = 'フロアの並び順を保存しました。'
    saveState.value = 'success'
  }
  catch {
    data.value = { floors: previousFloors }
    operationError.value = '並び順を保存できませんでした。もう一度お試しください。'
    saveMessage.value = operationError.value
    saveState.value = 'error'
  }
}

function requestDeleteFloor(floor: MapFloorItem) {
  deleteTarget.value = floor
}

async function confirmDeleteFloor() {
  const floor = deleteTarget.value
  if (!floor) return
  busyFloorId.value = floor.id
  operationError.value = ''
  saveMessage.value = ''
  saveState.value = 'saving'
  try {
    const response = await fetch(`/api/maps/${mapId}/floors/${floor.id}`, { method: 'DELETE' })
    if (!response.ok) throw new Error('Failed to delete floor')
    if (data.value) {
      data.value = {
        floors: data.value.floors
          .filter(item => item.id !== floor.id)
          .map((item, order) => ({ ...item, order })),
      }
    }
    deleteTarget.value = null
    saveMessage.value = 'フロアを削除しました。'
    saveState.value = 'success'
  }
  catch {
    operationError.value = 'フロアを削除できませんでした。もう一度お試しください。'
    saveMessage.value = operationError.value
    saveState.value = 'error'
  }
  finally {
    busyFloorId.value = ''
  }
}
</script>

<template>
  <NuxtPage v-if="route.params.floorId" />
  <div v-else class="max-w-5xl">
    <AdminSubnavigation :map-id="mapId" area="map-edit" />
    <NuxtLink :to="`/admin/maps/${mapId}/settings`" class="text-sm font-medium text-stone-600 hover:text-stone-900">
      ← マップ設定に戻る
    </NuxtLink>

    <header class="mt-5">
      <p class="text-sm font-medium text-terracotta-700">マップ設定</p>
      <h1 class="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-2xl">フロア管理</h1>
    </header>
    <SaveFeedback class="mt-6" :state="saveState" :message="saveMessage" />

    <details class="mt-6 border-y border-stone-200 py-4" :open="!data?.floors.length">
      <summary class="w-fit cursor-pointer text-sm font-semibold text-terracotta-700">＋ フロアを追加</summary>
      <div class="mt-6 grid gap-6 lg:grid-cols-2">
        <MediaPicker :key="createPickerRevision" :map-id="mapId" label="フロアイラスト" usage="floor" @selected="useUploadedImage" />
        <form class="space-y-5" @submit.prevent="createFloor">
          <div>
            <label for="new-floor-name" class="text-sm font-semibold text-stone-800">フロア名</label>
            <input id="new-floor-name" v-model="createInput.name" maxlength="50" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5" placeholder="例：1F / B1 / 屋外エリア">
          </div>
          <p class="text-sm leading-6 text-stone-600">現在地機能を使う場合は、追加後に2点合わせを設定します。</p>
          <p v-if="createError" role="alert" class="text-sm text-red-600">{{ createError }}</p>
          <button type="submit" :disabled="isCreating" class="rounded-lg bg-terracotta-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {{ isCreating ? '追加中…' : 'フロアを追加する' }}
          </button>
        </form>
      </div>
    </details>

    <section class="mt-6">
      <div class="flex items-end justify-between">
        <div>
          <h2 class="text-lg font-bold text-stone-900">登録済みフロア</h2>
        </div>
        <span v-if="data" class="text-sm text-stone-500">{{ data.floors.length }}件</span>
      </div>

      <div v-if="status === 'pending'" class="mt-4 rounded-xl bg-white p-6 text-sm text-stone-600">読み込んでいます…</div>
      <div v-else-if="error" class="mt-4 rounded-xl bg-red-50 p-6 text-sm text-red-700">フロアを読み込めませんでした。</div>
      <div v-else-if="data?.floors.length === 0" class="mt-4 rounded-xl border-2 border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-600">まだフロアはありません。</div>
      <ol v-else class="mt-4 space-y-4">
        <li v-for="(floor, index) in data?.floors" :key="floor.id" class="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div class="grid gap-5 sm:grid-cols-[9rem_1fr]">
            <img :src="floor.illustrationUrl" :alt="`${floor.name}のイラスト`" class="h-32 w-full rounded-lg bg-stone-100 object-contain">
            <div>
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <label :for="`floor-name-${floor.id}`" class="text-xs font-semibold text-stone-500">フロア名</label>
                    <span
                      class="rounded-full px-2.5 py-1 text-xs font-semibold"
                      :class="isFloorGeoreferenced(floor) ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
                    >
                      {{ isFloorGeoreferenced(floor) ? '位置合わせ設定済み' : '位置合わせ未設定' }}
                    </span>
                  </div>
                  <input :id="`floor-name-${floor.id}`" v-model="floor.name" maxlength="50" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">
                </div>
                <div class="flex gap-2">
                  <button type="button" :disabled="index === 0" :aria-label="`${floor.name}を上へ移動`" class="rounded-lg border border-stone-300 px-3 py-2 text-sm disabled:opacity-40" @click="moveFloor(index, -1)">↑</button>
                  <button type="button" :disabled="index === (data?.floors.length ?? 0) - 1" :aria-label="`${floor.name}を下へ移動`" class="rounded-lg border border-stone-300 px-3 py-2 text-sm disabled:opacity-40" @click="moveFloor(index, 1)">↓</button>
                </div>
              </div>
              <p v-if="!isFloorGeoreferenced(floor)" class="mt-3 text-xs leading-5 text-amber-700">このフロアでは現在地機能が使えません。必要な場合は2点合わせを設定してください。</p>
              <p class="mt-2 text-xs text-stone-500">登録スポット: {{ floor.spotCount }}件</p>
              <details class="mt-4 rounded-lg border border-stone-200 p-3">
                <summary class="cursor-pointer text-sm font-semibold text-stone-800">フロア画像を差し替える</summary>
                <p class="mt-2 text-xs leading-5 text-amber-700">既存ピンのイラスト上の相対位置と2点合わせ設定は維持されます。画像内容や比率が変わっても自動補正されません。差し替え後にマップの位置合わせを確認してください。</p>
                <div class="mt-3"><MediaPicker :map-id="mapId" label="差し替え画像" usage="floor" @selected="replaceFloorImage(floor, $event)" /></div>
              </details>
              <div class="mt-4 flex flex-wrap gap-3">
                <NuxtLink :to="`/admin/maps/${mapId}/floors/${floor.id}/georeference`" class="rounded-lg border border-terracotta-300 bg-terracotta-50 px-4 py-2 text-sm font-semibold text-terracotta-800 hover:bg-terracotta-100">{{ isFloorGeoreferenced(floor) ? '位置合わせを調整' : '位置合わせを設定' }}</NuxtLink>
                <NuxtLink :to="`/admin/maps/${mapId}/floors/${floor.id}/decorations`" class="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800">装飾を編集</NuxtLink>
                <button type="button" :disabled="busyFloorId === floor.id" class="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" @click="updateFloor(floor)">変更を保存</button>
                <button type="button" :disabled="busyFloorId === floor.id" class="rounded-lg px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60" @click="requestDeleteFloor(floor)">削除</button>
              </div>
            </div>
          </div>
        </li>
      </ol>
    </section>
    <ConfirmDialog :open="deleteTarget !== null" title="フロアを削除" :message="deleteMessage" confirm-label="削除する" destructive :busy="Boolean(busyFloorId)" @cancel="deleteTarget = null" @confirm="confirmDeleteFloor" />
  </div>
</template>
