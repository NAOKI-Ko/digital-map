<script setup lang="ts">
import MediaPicker from '~/components/admin/MediaPicker.vue'
import type { MapFloorListResponse } from '~~/shared/types/floor'
import type { FloorDecorationItem, FloorDecorationListResponse, FloorDecorationResponse } from '~~/shared/types/decoration'
import type { UploadedImage } from '~~/shared/types/upload'

definePageMeta({ layout: 'admin', middleware: 'auth' })
const route = useRoute()
const mapId = route.params.mapId as string
const floorId = route.params.floorId as string
const [{ data: floorData }, { data, refresh }] = await Promise.all([
  useFetch<MapFloorListResponse>(`/api/maps/${mapId}/floors`),
  useFetch<FloorDecorationListResponse>(`/api/maps/${mapId}/floors/${floorId}/decorations`),
])
const floor = computed(() => floorData.value?.floors.find(item => item.id === floorId))
const selectedId = ref<string | null>(null)
const selected = computed(() => data.value?.decorations.find(item => item.id === selectedId.value) ?? null)
const message = ref('')
const saveError = ref('')
let activeDragCleanup: (() => void) | null = null

async function addDecoration(image: UploadedImage) {
  const response = await $fetch<FloorDecorationResponse>(`/api/maps/${mapId}/floors/${floorId}/decorations`, { method: 'POST', body: { assetId: image.assetId, x: 0.5, y: 0.5, width: 0.2, rotation: 0 } })
  await refresh(); selectedId.value = response.decoration.id
}
async function save(item: FloorDecorationItem) {
  saveError.value = ''
  try {
    await $fetch(`/api/maps/${mapId}/floors/${floorId}/decorations/${item.id}`, { method: 'PATCH', body: { x: item.x, y: item.y, width: item.width, rotation: item.rotation, order: item.order } })
    message.value = '装飾を保存しました。'
  }
  catch {
    message.value = ''
    saveError.value = '装飾を保存できませんでした。保存済みの状態へ戻しました。'
    await refresh()
  }
}
function startDrag(event: PointerEvent, item: FloorDecorationItem) {
  activeDragCleanup?.()
  selectedId.value = item.id
  const surface = (event.currentTarget as HTMLElement).parentElement!
  const move = (next: PointerEvent) => {
    const bounds = surface.getBoundingClientRect()
    item.x = Math.min(1, Math.max(0, (next.clientX - bounds.left) / bounds.width))
    item.y = Math.min(1, Math.max(0, (next.clientY - bounds.top) / bounds.height))
  }
  const cleanup = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', end)
    window.removeEventListener('pointercancel', cancel)
    if (activeDragCleanup === cleanup) activeDragCleanup = null
  }
  const end = () => { cleanup(); void save(item) }
  const cancel = () => { cleanup(); void refresh() }
  activeDragCleanup = cleanup
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', end)
  window.addEventListener('pointercancel', cancel)
}
async function duplicate(item: FloorDecorationItem) {
  const response = await $fetch<FloorDecorationResponse>(`/api/maps/${mapId}/floors/${floorId}/decorations`, { method: 'POST', body: { assetId: item.assetId, x: Math.min(1, item.x + 0.03), y: Math.min(1, item.y + 0.03), width: item.width, rotation: item.rotation } })
  await refresh(); selectedId.value = response.decoration.id
}
async function remove(item: FloorDecorationItem) {
  await $fetch(`/api/maps/${mapId}/floors/${floorId}/decorations/${item.id}`, { method: 'DELETE' }); selectedId.value = null; await refresh()
}
async function moveLayer(item: FloorDecorationItem, delta: number) {
  item.order = Math.max(0, item.order + delta); await save(item); await refresh()
}
onBeforeUnmount(() => activeDragCleanup?.())
</script>

<template>
  <div class="max-w-6xl">
    <NuxtLink :to="`/admin/maps/${mapId}/floors`" class="text-sm font-semibold text-stone-600">← フロア管理に戻る</NuxtLink>
    <h1 class="mt-5 text-3xl font-bold">{{ floor?.name }}の装飾</h1>
    <p class="mt-2 text-sm text-stone-600">画像を配置してドラッグ、サイズ変更、回転、前後移動ができます。ピンより下の専用レイヤーに表示されます。</p>
    <div class="mt-7 grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div v-if="floor" class="relative select-none overflow-hidden rounded-xl border bg-stone-100" :style="{ aspectRatio: `${floor.imageWidth}/${floor.imageHeight}` }">
        <img :src="floor.illustrationUrl" alt="" class="absolute inset-0 size-full object-contain">
        <img v-for="item in data?.decorations" :key="item.id" :src="item.imageUrl" alt="" draggable="false" class="absolute z-10 cursor-move object-contain" :class="{ 'outline outline-2 outline-terracotta-600': item.id === selectedId }" :style="{ left: `${item.x * 100}%`, top: `${item.y * 100}%`, width: `${item.width * 100}%`, transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`, zIndex: item.order + 1 }" @pointerdown.prevent="startDrag($event, item)" @click="selectedId = item.id">
      </div>
      <aside class="space-y-5">
        <MediaPicker :map-id="mapId" label="装飾画像" usage="decoration" @selected="addDecoration" />
        <section v-if="selected" class="rounded-xl border bg-white p-4">
          <h2 class="font-bold">選択中</h2>
          <label class="mt-4 block text-xs font-semibold">サイズ<input v-model.number="selected.width" type="range" min="0.03" max="1" step="0.01" class="mt-2 w-full" @change="save(selected)"></label>
          <label class="mt-4 block text-xs font-semibold">回転<input v-model.number="selected.rotation" type="range" min="-180" max="180" step="1" class="mt-2 w-full" @change="save(selected)"></label>
          <div class="mt-4 grid grid-cols-2 gap-2"><button type="button" class="rounded border p-2 text-xs" @click="moveLayer(selected, -1)">後ろへ</button><button type="button" class="rounded border p-2 text-xs" @click="moveLayer(selected, 1)">前へ</button><button type="button" class="rounded border p-2 text-xs" @click="duplicate(selected)">複製</button><button type="button" class="rounded border border-red-200 p-2 text-xs text-red-700" @click="remove(selected)">インスタンス削除</button></div>
        </section>
        <p v-if="message" role="status" class="text-sm text-stone-600">{{ message }}</p>
        <p v-if="saveError" role="alert" class="text-sm text-red-700">{{ saveError }}</p>
      </aside>
    </div>
  </div>
</template>
