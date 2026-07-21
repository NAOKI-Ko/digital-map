<script setup lang="ts">
import AddressGeocoder from '~/components/admin/AddressGeocoder.vue'
import GeoReferenceEditor from '~/components/admin/GeoReferenceEditor.vue'
import {
  getFloorGeoReference,
  getGeoReferenceValidationError,
  normalizeGeoReferenceRectangle,
  type GeoReferenceRectangle,
  type LatLng,
} from '~~/lib/geo'
import type { GeoReferenceInput } from '~~/shared/schemas/georeference'
import type { MapFloorListResponse, MapFloorResponse } from '~~/shared/types/floor'
import type { GeocodeResult } from '~~/shared/types/geocode'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const route = useRoute()
const mapId = route.params.mapId as string
const floorId = route.params.floorId as string
const { data, error, status } = await useFetch<MapFloorListResponse>(`/api/maps/${mapId}/floors`)
const floor = computed(() => data.value?.floors.find(item => item.id === floorId))
const rectangle = ref<GeoReferenceRectangle | null>(null)
const geoReferenceEditor = useTemplateRef<{ focusLocation: (position: LatLng) => void }>('geoReferenceEditor')
const isSaving = ref(false)
const saveError = ref('')
const successMessage = ref('')
const cameFromEditor = computed(() => route.query.from === 'editor')
const backPath = computed(() => cameFromEditor.value
  ? { path: `/admin/maps/${mapId}/editor`, query: { floorId } }
  : `/admin/maps/${mapId}/floors`)

watch(floor, (value) => {
  if (value) rectangle.value = getFloorGeoReference(value)
}, { immediate: true })

useHead(() => ({
  title: `ジオリファレンス - ${floor.value?.name ?? 'フロア'} | デジタルマップ`,
}))

function toInput(value: GeoReferenceRectangle): GeoReferenceInput {
  const normalized = normalizeGeoReferenceRectangle(value)
  return {
    topLeftLat: normalized.topLeft.lat,
    topLeftLng: normalized.topLeft.lng,
    bottomRightLat: normalized.bottomRight.lat,
    bottomRightLng: normalized.bottomRight.lng,
  }
}

function focusSearchResult(result: GeocodeResult) {
  geoReferenceEditor.value?.focusLocation({ lat: result.lat, lng: result.lng })
}

async function save() {
  if (!floor.value || !rectangle.value) return
  const validationError = getGeoReferenceValidationError(rectangle.value)
  if (validationError) {
    saveError.value = validationError
    return
  }
  isSaving.value = true
  saveError.value = ''
  successMessage.value = ''

  try {
    const response = await $fetch<MapFloorResponse>(`/api/maps/${mapId}/floors/${floorId}/georeference`, {
      method: 'PATCH',
      body: toInput(rectangle.value),
    })
    if (data.value) {
      data.value = {
        floors: data.value.floors.map(item => item.id === floorId ? response.floor : item),
      }
    }
    rectangle.value = getFloorGeoReference(response.floor)
    successMessage.value = 'イラストを表示する矩形範囲を保存しました。'
  }
  catch {
    saveError.value = '範囲を保存できませんでした。矩形の位置と大きさを確認してください。'
  }
  finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="max-w-6xl">
    <NuxtLink :to="backPath" class="text-sm font-medium text-stone-600 hover:text-stone-900">← {{ cameFromEditor ? 'ピン配置エディタに戻る' : 'フロア管理に戻る' }}</NuxtLink>

    <section v-if="status === 'pending'" class="mt-8 rounded-xl bg-white p-8 text-sm text-stone-600">読み込んでいます…</section>
    <section v-else-if="error || !floor" class="mt-8 rounded-xl bg-red-50 p-8 text-sm text-red-700">フロアが見つかりません。</section>
    <template v-else>
      <header class="mt-5">
        <p class="text-sm font-medium text-terracotta-700">{{ floor.name }}</p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">ジオリファレンス設定</h1>
        <p class="mt-2 text-sm text-stone-600">対象エリアへ赤い矩形を移動・リサイズし、イラストのおおよその表示範囲を決めます。</p>
      </header>

      <section class="mt-8">
        <AddressGeocoder @select="focusSearchResult" />
      </section>

      <section class="mt-8 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
        <ClientOnly>
          <GeoReferenceEditor ref="geoReferenceEditor" v-model="rectangle" :illustration-url="floor.illustrationUrl" :initial-rectangle="getFloorGeoReference(floor)" />
          <template #fallback><div class="h-[34rem] animate-pulse rounded-xl bg-stone-100" /></template>
        </ClientOnly>
        <p class="mt-4 text-xs leading-5 text-stone-500">デフォルメが強いイラストほど、道路や建物を厳密に一致させる必要はありません。現在地表示の目安として大体の範囲を合わせてください。</p>
      </section>

      <div v-if="saveError" role="alert" class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{{ saveError }}</div>
      <div v-if="successMessage" role="status" class="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{{ successMessage }}</div>
      <div class="mt-5 flex flex-wrap justify-end gap-3">
        <NuxtLink v-if="cameFromEditor" :to="backPath" class="rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50">ピン配置エディタに戻る</NuxtLink>
        <button type="button" :disabled="isSaving || !rectangle" class="rounded-lg bg-terracotta-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60" @click="save">
          {{ isSaving ? '保存中…' : 'この範囲で保存' }}
        </button>
      </div>
    </template>
  </div>
</template>
