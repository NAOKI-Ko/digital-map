<script setup lang="ts">
import PinPlacementMap from '~/components/admin/PinPlacementMap.vue'
import type { LatLng } from '~~/lib/geo'
import type { MapFloorListResponse } from '~~/shared/types/floor'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const route = useRoute()
const mapId = route.params.mapId as string
const { data, error, status } = await useFetch<MapFloorListResponse>(`/api/maps/${mapId}/floors`)
const selectedFloorId = ref('')
const position = ref<LatLng | null>(null)
const selectedFloor = computed(() => data.value?.floors.find(floor => floor.id === selectedFloorId.value))

watch(() => data.value?.floors, (floors) => {
  if (floors?.length && !floors.some(floor => floor.id === selectedFloorId.value)) {
    selectedFloorId.value = floors[0]?.id ?? ''
  }
}, { immediate: true })

watch(selectedFloorId, () => position.value = null)

useHead({ title: 'ピン配置エディタ | デジタルマップ' })

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

function isGeoreferenced() {
  const floor = selectedFloor.value
  return floor
    && floor.topLeftLat !== null && floor.topLeftLng !== null
    && floor.topRightLat !== null && floor.topRightLng !== null
    && floor.bottomRightLat !== null && floor.bottomRightLng !== null
    && floor.bottomLeftLat !== null && floor.bottomLeftLng !== null
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

      <div v-if="!isGeoreferenced()" class="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">このフロアはジオリファレンス未設定です。通常地図上にはピンを置けますが、先に四隅を設定することをおすすめします。</div>

      <div class="mt-5 grid gap-5 xl:grid-cols-[1fr_20rem]">
        <ClientOnly>
          <PinPlacementMap :key="selectedFloor.id" v-model="position" :floor="selectedFloor" />
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
        </aside>
      </div>
    </template>
  </div>
</template>
