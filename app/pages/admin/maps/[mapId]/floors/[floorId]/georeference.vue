<script setup lang="ts">
import GeoReferenceEditor from '~/components/admin/GeoReferenceEditor.vue'
import { createDefaultGeoReference, type GeoReferenceCoordinates } from '~~/lib/geo'
import type { GeoReferenceInput } from '~~/shared/schemas/georeference'
import type { MapFloorItem, MapFloorListResponse, MapFloorResponse } from '~~/shared/types/floor'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const route = useRoute()
const mapId = route.params.mapId as string
const floorId = route.params.floorId as string
const { data, error, status } = await useFetch<MapFloorListResponse>(`/api/maps/${mapId}/floors`)
const floor = computed(() => data.value?.floors.find(item => item.id === floorId))
const coordinates = ref<GeoReferenceCoordinates>(createDefaultGeoReference())
const isSaving = ref(false)
const saveError = ref('')
const successMessage = ref('')

watch(floor, (value) => {
  if (value) coordinates.value = coordinatesFromFloor(value)
}, { immediate: true })

useHead(() => ({
  title: `ジオリファレンス - ${floor.value?.name ?? 'フロア'} | デジタルマップ`,
}))

function coordinatesFromFloor(value: MapFloorItem): GeoReferenceCoordinates {
  if (
    value.topLeftLat === null || value.topLeftLng === null
    || value.topRightLat === null || value.topRightLng === null
    || value.bottomRightLat === null || value.bottomRightLng === null
    || value.bottomLeftLat === null || value.bottomLeftLng === null
  ) {
    return createDefaultGeoReference()
  }

  return {
    topLeft: { lat: value.topLeftLat, lng: value.topLeftLng },
    topRight: { lat: value.topRightLat, lng: value.topRightLng },
    bottomRight: { lat: value.bottomRightLat, lng: value.bottomRightLng },
    bottomLeft: { lat: value.bottomLeftLat, lng: value.bottomLeftLng },
  }
}

function toInput(value: GeoReferenceCoordinates): GeoReferenceInput {
  return {
    topLeftLat: value.topLeft.lat,
    topLeftLng: value.topLeft.lng,
    topRightLat: value.topRight.lat,
    topRightLng: value.topRight.lng,
    bottomRightLat: value.bottomRight.lat,
    bottomRightLng: value.bottomRight.lng,
    bottomLeftLat: value.bottomLeft.lat,
    bottomLeftLng: value.bottomLeft.lng,
  }
}

async function save() {
  if (!floor.value) return
  isSaving.value = true
  saveError.value = ''
  successMessage.value = ''

  try {
    const response = await $fetch<MapFloorResponse>(`/api/maps/${mapId}/floors/${floorId}/georeference`, {
      method: 'PATCH',
      body: toInput(coordinates.value),
    })
    if (data.value) {
      data.value = {
        floors: data.value.floors.map(item => item.id === floorId ? response.floor : item),
      }
    }
    successMessage.value = '四隅の座標を保存しました。'
  }
  catch {
    saveError.value = '座標を保存できませんでした。四隅の位置を確認してください。'
  }
  finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="max-w-6xl">
    <NuxtLink :to="`/admin/maps/${mapId}/floors`" class="text-sm font-medium text-stone-600 hover:text-stone-900">← フロア管理に戻る</NuxtLink>

    <section v-if="status === 'pending'" class="mt-8 rounded-xl bg-white p-8 text-sm text-stone-600">読み込んでいます…</section>
    <section v-else-if="error || !floor" class="mt-8 rounded-xl bg-red-50 p-8 text-sm text-red-700">フロアが見つかりません。</section>
    <template v-else>
      <header class="mt-5">
        <p class="text-sm font-medium text-terracotta-700">{{ floor.name }}</p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">ジオリファレンス設定</h1>
        <p class="mt-2 text-sm text-stone-600">通常の地図上でイラストの四隅を合わせ、実世界の緯度経度と対応づけます。</p>
      </header>

      <section class="mt-8 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
        <ClientOnly>
          <GeoReferenceEditor v-model="coordinates" :illustration-url="floor.illustrationUrl" :initial-coordinates="coordinatesFromFloor(floor)" />
          <template #fallback><div class="h-[34rem] animate-pulse rounded-xl bg-stone-100" /></template>
        </ClientOnly>
      </section>

      <div v-if="saveError" role="alert" class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{{ saveError }}</div>
      <div v-if="successMessage" role="status" class="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{{ successMessage }}</div>
      <div class="mt-5 flex justify-end">
        <button type="button" :disabled="isSaving" class="rounded-lg bg-terracotta-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60" @click="save">
          {{ isSaving ? '保存中…' : '四隅の座標を保存する' }}
        </button>
      </div>
    </template>
  </div>
</template>
