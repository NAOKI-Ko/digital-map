<script setup lang="ts">
import ImageUploader from '~/components/admin/ImageUploader.vue'
import type { FloorCreateInput, FloorUpdateInput } from '~~/shared/schemas/floor'
import { floorCreateSchema, floorUpdateSchema } from '~~/shared/schemas/floor'
import type { MapFloorItem, MapFloorListResponse, MapFloorResponse } from '~~/shared/types/floor'
import type { AdminMapResponse } from '~~/shared/types/map'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const route = useRoute()
const mapId = route.params.mapId as string
const { data: mapData } = await useFetch<AdminMapResponse>(`/api/maps/${mapId}`)
const { data, error, status } = await useFetch<MapFloorListResponse>(`/api/maps/${mapId}/floors`)
const createInput = reactive<FloorCreateInput>({ name: '', illustrationUrl: '', isOutdoor: true })
const createError = ref('')
const isCreating = ref(false)
const busyFloorId = ref('')

useHead(() => ({
  title: `フロア管理 - ${mapData.value?.map.name ?? 'マップ'} | デジタルマップ`,
}))

function useUploadedImage(url: string) {
  createInput.illustrationUrl = url
  createError.value = ''
}

async function createFloor() {
  const result = floorCreateSchema.safeParse(createInput)
  if (!result.success) {
    createError.value = result.error.issues[0]?.message ?? '入力内容を確認してください。'
    return
  }

  isCreating.value = true
  createError.value = ''
  try {
    const response = await $fetch<MapFloorResponse>(`/api/maps/${mapId}/floors`, {
      method: 'POST',
      body: result.data,
    })
    if (data.value) {
      data.value = { floors: [...data.value.floors, response.floor] }
    }
    Object.assign(createInput, { name: '', illustrationUrl: '', isOutdoor: true })
  }
  catch {
    createError.value = 'フロアを追加できませんでした。もう一度お試しください。'
  }
  finally {
    isCreating.value = false
  }
}

async function updateFloor(floor: MapFloorItem) {
  const input: FloorUpdateInput = { name: floor.name, isOutdoor: floor.isOutdoor }
  const result = floorUpdateSchema.safeParse(input)
  if (!result.success) {
    window.alert(result.error.issues[0]?.message ?? '入力内容を確認してください。')
    return
  }

  busyFloorId.value = floor.id
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
  }
  catch {
    window.alert('フロアを保存できませんでした。')
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
    await $fetch(`/api/maps/${mapId}/floors/reorder`, {
      method: 'PATCH',
      body: { floorIds: reordered.map(floor => floor.id) },
    })
  }
  catch {
    data.value = { floors: previousFloors }
    window.alert('並び順を保存できませんでした。')
  }
}

async function deleteFloor(floor: MapFloorItem) {
  const message = floor.spotCount > 0
    ? `「${floor.name}」と登録済みスポット${floor.spotCount}件を削除します。元に戻せません。よろしいですか？`
    : `「${floor.name}」を削除します。元に戻せません。よろしいですか？`
  if (!window.confirm(message)) return

  busyFloorId.value = floor.id
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
  }
  catch {
    window.alert('フロアを削除できませんでした。')
  }
  finally {
    busyFloorId.value = ''
  }
}
</script>

<template>
  <NuxtPage v-if="route.params.floorId" />
  <div v-else class="max-w-5xl">
    <NuxtLink :to="`/admin/maps/${mapId}/settings`" class="text-sm font-medium text-stone-600 hover:text-stone-900">
      ← マップ設定に戻る
    </NuxtLink>

    <header class="mt-5">
      <p class="text-sm font-medium text-terracotta-700">マップ設定</p>
      <h1 class="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">フロア管理</h1>
      <p class="mt-2 text-sm text-stone-600">フロアごとのイラスト、名称、現在地表示の可否を管理します。</p>
    </header>

    <section class="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 class="text-lg font-bold text-stone-900">フロアを追加</h2>
      <div class="mt-6 grid gap-6 lg:grid-cols-2">
        <ImageUploader label="フロアイラスト" @uploaded="useUploadedImage($event.url)" />
        <form class="space-y-5" @submit.prevent="createFloor">
          <div>
            <label for="new-floor-name" class="text-sm font-semibold text-stone-800">フロア名</label>
            <input id="new-floor-name" v-model="createInput.name" maxlength="50" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5" placeholder="例：1F / B1 / 屋外エリア">
          </div>
          <label class="flex items-start gap-3 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
            <input v-model="createInput.isOutdoor" type="checkbox" class="mt-0.5 h-4 w-4 rounded border-stone-300 text-terracotta-600">
            <span><strong class="block text-stone-900">屋外フロア</strong>現在地表示を利用できるフロアとして登録します。</span>
          </label>
          <p v-if="createInput.illustrationUrl" class="break-all text-xs text-emerald-700">画像を選択済み: {{ createInput.illustrationUrl }}</p>
          <p v-if="createError" role="alert" class="text-sm text-red-600">{{ createError }}</p>
          <button type="submit" :disabled="isCreating" class="rounded-lg bg-terracotta-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {{ isCreating ? '追加中…' : 'フロアを追加する' }}
          </button>
        </form>
      </div>
    </section>

    <section class="mt-6">
      <div class="flex items-end justify-between">
        <div>
          <h2 class="text-lg font-bold text-stone-900">登録済みフロア</h2>
          <p class="mt-1 text-sm text-stone-600">上下ボタンで公開画面の表示順を変更できます。</p>
        </div>
        <span v-if="data" class="text-sm text-stone-500">{{ data.floors.length }}件</span>
      </div>

      <div v-if="status === 'pending'" class="mt-4 rounded-xl bg-white p-6 text-sm text-stone-600">読み込んでいます…</div>
      <div v-else-if="error" class="mt-4 rounded-xl bg-red-50 p-6 text-sm text-red-700">フロアを読み込めませんでした。</div>
      <div v-else-if="data?.floors.length === 0" class="mt-4 rounded-xl border-2 border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-600">まだフロアはありません。</div>
      <ol v-else class="mt-4 space-y-4">
        <li v-for="(floor, index) in data?.floors" :key="floor.id" class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div class="grid gap-5 sm:grid-cols-[9rem_1fr]">
            <img :src="floor.illustrationUrl" :alt="`${floor.name}のイラスト`" class="h-32 w-full rounded-lg bg-stone-100 object-contain">
            <div>
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="flex-1">
                  <label :for="`floor-name-${floor.id}`" class="text-xs font-semibold text-stone-500">フロア名</label>
                  <input :id="`floor-name-${floor.id}`" v-model="floor.name" maxlength="50" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">
                </div>
                <div class="flex gap-2">
                  <button type="button" :disabled="index === 0" :aria-label="`${floor.name}を上へ移動`" class="rounded-lg border border-stone-300 px-3 py-2 text-sm disabled:opacity-40" @click="moveFloor(index, -1)">↑</button>
                  <button type="button" :disabled="index === (data?.floors.length ?? 0) - 1" :aria-label="`${floor.name}を下へ移動`" class="rounded-lg border border-stone-300 px-3 py-2 text-sm disabled:opacity-40" @click="moveFloor(index, 1)">↓</button>
                </div>
              </div>
              <label class="mt-4 flex items-center gap-2 text-sm text-stone-700">
                <input v-model="floor.isOutdoor" type="checkbox" class="h-4 w-4 rounded border-stone-300 text-terracotta-600">
                屋外（現在地表示あり）
              </label>
              <p class="mt-2 text-xs text-stone-500">登録スポット: {{ floor.spotCount }}件</p>
              <div class="mt-4 flex flex-wrap gap-3">
                <NuxtLink :to="`/admin/maps/${mapId}/floors/${floor.id}/georeference`" class="rounded-lg border border-terracotta-300 bg-terracotta-50 px-4 py-2 text-sm font-semibold text-terracotta-800 hover:bg-terracotta-100">ジオリファレンスを設定</NuxtLink>
                <button type="button" :disabled="busyFloorId === floor.id" class="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" @click="updateFloor(floor)">変更を保存</button>
                <button type="button" :disabled="busyFloorId === floor.id" class="rounded-lg px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60" @click="deleteFloor(floor)">削除</button>
              </div>
            </div>
          </div>
        </li>
      </ol>
    </section>
  </div>
</template>
