<script setup lang="ts">
import AddressGeocoder from '~/components/admin/AddressGeocoder.vue'
import GeoReferenceWizard from '~/components/admin/GeoReferenceWizard.vue'
import { createEmptyGeoReferenceDraft, isGeoReferenceDraftComplete } from '~/composables/useGeoReference'
import { getGeoReferenceValidationError, type CompleteFloorGeoReference, type LatLng } from '~~/lib/geo'
import type { MapFloorListResponse, MapFloorResponse } from '~~/shared/types/floor'
import type { GeocodeResult } from '~~/shared/types/geocode'
import type { GeoReferenceDraft } from '~~/shared/types/georeference'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const route = useRoute()
const mapId = route.params.mapId as string
const floorId = route.params.floorId as string
const { data, error, status } = await useFetch<MapFloorListResponse>(`/api/maps/${mapId}/floors`)
const floor = computed(() => data.value?.floors.find(item => item.id === floorId))
const draft = ref<GeoReferenceDraft>(createEmptyGeoReferenceDraft())
const wizard = useTemplateRef<{ focusLocation: (position: LatLng) => void }>('wizard')
const isSaving = ref(false)
const saveError = ref('')
const successMessage = ref('')
const cameFromEditor = computed(() => route.query.from === 'editor')
const backPath = computed(() => cameFromEditor.value
  ? { path: `/admin/maps/${mapId}/editor`, query: { floorId } }
  : `/admin/maps/${mapId}/floors`)
const hasImageDimensions = computed(() => Boolean(floor.value?.imageWidth && floor.value?.imageHeight))
const completeGeoReference = computed<CompleteFloorGeoReference | null>(() => {
  if (!floor.value?.imageWidth || !floor.value.imageHeight || !isGeoReferenceDraftComplete(draft.value)) return null
  return {
    imageWidth: floor.value.imageWidth,
    imageHeight: floor.value.imageHeight,
    refAPixelX: draft.value.refAPixelX!,
    refAPixelY: draft.value.refAPixelY!,
    refALat: draft.value.refALat!,
    refALng: draft.value.refALng!,
    refBPixelX: draft.value.refBPixelX!,
    refBPixelY: draft.value.refBPixelY!,
    refBLat: draft.value.refBLat!,
    refBLng: draft.value.refBLng!,
  }
})
const validationError = computed(() => completeGeoReference.value
  ? getGeoReferenceValidationError(completeGeoReference.value)
  : null)

watch(floor, (value) => {
  if (!value) return
  draft.value = {
    refAPixelX: value.refAPixelX,
    refAPixelY: value.refAPixelY,
    refALat: value.refALat,
    refALng: value.refALng,
    refBPixelX: value.refBPixelX,
    refBPixelY: value.refBPixelY,
    refBLat: value.refBLat,
    refBLng: value.refBLng,
  }
}, { immediate: true })

useHead(() => ({
  title: `ジオリファレンス - ${floor.value?.name ?? 'フロア'} | デジタルマップ`,
}))

function focusSearchResult(result: GeocodeResult) {
  wizard.value?.focusLocation({ lat: result.lat, lng: result.lng })
}

async function save() {
  if (!floor.value || !isGeoReferenceDraftComplete(draft.value)) return
  if (validationError.value) {
    saveError.value = validationError.value
    return
  }
  isSaving.value = true
  saveError.value = ''
  successMessage.value = ''

  try {
    const response = await $fetch<MapFloorResponse>(`/api/maps/${mapId}/floors/${floorId}/georeference`, {
      method: 'PATCH',
      body: draft.value,
    })
    if (data.value) {
      data.value = {
        floors: data.value.floors.map(item => item.id === floorId ? response.floor : item),
      }
    }
    successMessage.value = '2つの基準点を保存しました。'
  }
  catch (error) {
    saveError.value = getErrorMessage(error)
  }
  finally {
    isSaving.value = false
  }
}

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'data' in error) {
    const data = error.data as { statusMessage?: string }
    if (data.statusMessage) return data.statusMessage
  }
  return '基準点を保存できませんでした。選んだ場所を確認してください。'
}
</script>

<template>
  <div class="max-w-7xl">
    <NuxtLink :to="backPath" class="text-sm font-medium text-stone-600 hover:text-stone-900">← {{ cameFromEditor ? 'ピン配置エディタに戻る' : 'フロア管理に戻る' }}</NuxtLink>

    <section v-if="status === 'pending'" class="mt-8 rounded-xl bg-white p-8 text-sm text-stone-600">読み込んでいます…</section>
    <section v-else-if="error || !floor" class="mt-8 rounded-xl bg-red-50 p-8 text-sm text-red-700">フロアが見つかりません。</section>
    <template v-else>
      <header class="mt-5">
        <p class="text-sm font-medium text-terracotta-700">{{ floor.name }}</p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">2点合わせ設定</h1>
        <p class="mt-2 text-sm text-stone-600">イラストと実地図で同じ目印を2組選ぶと、位置・向き・大きさを自動計算します。</p>
      </header>

      <section class="mt-6">
        <AddressGeocoder @select="focusSearchResult" />
      </section>

      <section v-if="!hasImageDimensions" class="mt-6 rounded-xl bg-amber-50 p-5 text-sm text-amber-800">
        この画像には幅・高さの情報がありません。フロア画像を再アップロードしてください。
      </section>
      <section v-else class="mt-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
        <ClientOnly>
          <GeoReferenceWizard
            ref="wizard"
            v-model="draft"
            :illustration-url="floor.illustrationUrl"
            :image-width="floor.imageWidth!"
            :image-height="floor.imageHeight!"
          />
          <template #fallback><div class="h-[36rem] animate-pulse rounded-xl bg-stone-100" /></template>
        </ClientOnly>
        <p class="mt-5 text-xs leading-5 text-stone-500">デフォルメが強いイラストほど、選んだ2点以外の場所ではズレが大きくなる場合があります。正確なナビゲーションではなく、現在地の目安として利用します。</p>
      </section>

      <div v-if="saveError" role="alert" class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{{ saveError }}</div>
      <div v-else-if="validationError" role="alert" class="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{{ validationError }}</div>
      <div v-if="successMessage" role="status" class="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{{ successMessage }}</div>
      <div class="mt-5 flex flex-wrap justify-end gap-3">
        <NuxtLink v-if="cameFromEditor" :to="backPath" class="rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50">ピン配置エディタに戻る</NuxtLink>
        <button type="button" :disabled="isSaving || !isGeoReferenceDraftComplete(draft) || Boolean(validationError)" class="rounded-lg bg-terracotta-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60" @click="save">
          {{ isSaving ? '保存中…' : 'この内容で保存' }}
        </button>
      </div>
    </template>
  </div>
</template>
