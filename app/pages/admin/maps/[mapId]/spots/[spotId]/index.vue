<script setup lang="ts">
import PinDesignEditor from '~/components/admin/PinDesignEditor.vue'
import SpotPhotoManager from '~/components/admin/SpotPhotoManager.vue'
import SpotPublishPanel from '~/components/admin/SpotPublishPanel.vue'
import SpotForm from '~/components/admin/SpotForm.vue'
import DuplicateSpotDialog from '~/components/admin/DuplicateSpotDialog.vue'
import type { SpotFormInput } from '~~/shared/schemas/spot'
import type { AdminSpotResponse } from '~~/shared/types/spot'
import type { SpotDuplicateMatch, SpotDuplicateResponse } from '~~/shared/types/spot-duplicate'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const route = useRoute()
const mapId = route.params.mapId as string
const spotId = route.params.spotId as string
const returnTo = computed(() => typeof route.query.returnTo === 'string' && route.query.returnTo.startsWith(`/admin/maps/${mapId}/spots`) ? route.query.returnTo : `/admin/maps/${mapId}/spots`)
const { data, error, status } = await useFetch<AdminSpotResponse>(`/api/maps/${mapId}/spots/${spotId}`)
const isSubmitting = ref(false)
const submitError = ref('')
const successMessage = ref(route.query.saved === 'spot-created' ? 'スポットを登録しました。' : '')
const duplicateMatches = ref<SpotDuplicateMatch[]>([])
const pendingInput = ref<SpotFormInput | null>(null)
const english = reactive({
  name: data.value?.spot.englishTranslation?.name ?? '',
  description: data.value?.spot.englishTranslation?.description ?? '',
  address: data.value?.spot.englishTranslation?.address ?? '',
  hoursText: data.value?.spot.englishTranslation?.hoursText ?? '',
  holidayText: data.value?.spot.englishTranslation?.holidayText ?? '',
  customValues: { ...(data.value?.spot.englishTranslation?.customValues ?? {}) },
})
const englishState = ref<'idle' | 'saving' | 'success' | 'error'>('idle')
const englishMessage = ref('')

const initialValue = computed<SpotFormInput | undefined>(() => data.value
  ? {
      floorId: data.value.spot.floorId,
      name: data.value.spot.name,
      categoryIds: data.value.spot.categories.map(category => category.id),
      importance: data.value.spot.importance,
      description: data.value.spot.description ?? '',
      address: data.value.spot.address ?? '',
      website: data.value.spot.website ?? '',
      hoursText: data.value.spot.hoursText ?? '',
      holidayText: data.value.spot.holidayText ?? '',
      phone: data.value.spot.phone ?? '',
      customValues: data.value.spot.customValues,
      x: data.value.spot.x,
      y: data.value.spot.y,
    }
  : undefined)

useHead(() => ({ title: `${data.value?.spot.name ?? 'スポット編集'} | デジタルマップ` }))

async function updateSpot(input: SpotFormInput) {
  isSubmitting.value = true
  submitError.value = ''
  successMessage.value = ''
  try {
    const duplicateResponse = await $fetch<SpotDuplicateResponse>(`/api/maps/${mapId}/spots/duplicates`, {
      query: { name: input.name, excludeId: spotId },
    })
    if (duplicateResponse.matches.length) {
      pendingInput.value = input
      duplicateMatches.value = duplicateResponse.matches
      return
    }
    await persistSpot(input)
  }
  catch {
    submitError.value = 'スポット情報を保存できませんでした。入力内容を確認してください。'
  }
  finally {
    isSubmitting.value = false
  }
}

async function persistSpot(input: SpotFormInput) {
  isSubmitting.value = true
  submitError.value = ''
  successMessage.value = ''
  try {
    data.value = await $fetch<AdminSpotResponse>(`/api/maps/${mapId}/spots/${spotId}`, { method: 'PATCH', body: input })
    successMessage.value = 'スポット情報を保存しました。'
  }
  catch {
    submitError.value = 'スポット情報を保存できませんでした。入力内容を確認してください。'
  }
  finally {
    isSubmitting.value = false
  }
}

function cancelDuplicateWarning() {
  duplicateMatches.value = []
  pendingInput.value = null
}

function continueWithDuplicate() {
  const input = pendingInput.value
  cancelDuplicateWarning()
  if (input) void persistSpot(input)
}

async function saveEnglish() {
  englishState.value = 'saving'
  try {
    await $fetch(`/api/maps/${mapId}/spots/${spotId}/translations`, { method: 'PATCH', body: english })
    englishState.value = 'success'
    englishMessage.value = '英語訳を保存しました。'
  }
  catch (error: any) {
    englishState.value = 'error'
    englishMessage.value = error?.data?.statusMessage ?? '英語訳を保存できませんでした。'
  }
}
</script>

<template>
  <div class="max-w-4xl" data-page="spot-detail">
    <NuxtLink :to="returnTo" class="text-sm font-medium text-stone-600 hover:text-stone-900">← スポット一覧に戻る</NuxtLink>
    <div v-if="status === 'pending'" class="mt-8 rounded-xl bg-white p-8 text-sm text-stone-600">読み込んでいます…</div>
    <div v-else-if="error || !data || !initialValue" class="mt-8 rounded-xl bg-red-50 p-8 text-sm text-red-700">スポットが見つかりません。</div>
    <template v-else>
      <header class="mt-5">
        <p class="text-sm font-medium text-terracotta-700">スポット編集</p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">{{ data.spot.name }}</h1>
        <p class="mt-2 text-sm text-stone-600">基本情報や営業情報を編集します。</p>
      </header>
      <NuxtLink :to="{ path: `/admin/maps/${mapId}/editor`, query: { floorId: data.spot.floorId, placeSpotId: data.spot.id } }" class="mt-5 inline-flex rounded-lg bg-terracotta-600 px-4 py-2.5 text-sm font-semibold text-white">{{ data.spot.x === null || data.spot.y === null ? '位置を設定' : '位置を再設定' }}</NuxtLink>
      <NuxtLink :to="`/admin/maps/${mapId}/spots/${spotId}/assignee`" class="ml-2 mt-5 inline-flex rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold">Spot担当者</NuxtLink>
      <SaveFeedback class="mt-6" :state="isSubmitting ? 'saving' : submitError ? 'error' : successMessage ? 'success' : 'idle'" :message="submitError || successMessage" />
      <section class="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <ClientOnly>
          <SpotForm :floors="data.floors" :categories="data.categories" :fields="data.fields" :initial-value="initialValue" :is-submitting="isSubmitting" @submit="updateSpot" />
          <template #fallback>
            <p class="text-sm text-stone-600">フォームを読み込んでいます…</p>
          </template>
        </ClientOnly>
      </section>
      <section v-if="data.spot.enabledLocales?.includes('en')" class="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 class="text-lg font-bold">英語訳</h2>
        <p class="mt-1 text-sm text-stone-600">未入力の項目は日本語へフォールバックします。電話番号とURLは共通です。</p>
        <form class="mt-5 grid gap-4 sm:grid-cols-2" @submit.prevent="saveEnglish">
          <label class="text-sm font-semibold">Name<input v-model="english.name" class="mt-1 w-full rounded border px-3 py-2"></label>
          <label class="text-sm font-semibold">Address<input v-model="english.address" class="mt-1 w-full rounded border px-3 py-2"></label>
          <label class="text-sm font-semibold sm:col-span-2">Description<textarea v-model="english.description" rows="3" class="mt-1 w-full rounded border px-3 py-2" /></label>
          <label class="text-sm font-semibold">Hours<input v-model="english.hoursText" class="mt-1 w-full rounded border px-3 py-2"></label>
          <label class="text-sm font-semibold">Holiday<input v-model="english.holidayText" class="mt-1 w-full rounded border px-3 py-2"></label>
          <label v-for="field in data.fields.filter(field => field.kind === 'custom' && ['single_line_text', 'multiline_text'].includes(field.type))" :key="field.id" class="text-sm font-semibold">{{ field.label }} (English)<input v-model="english.customValues[field.id]" class="mt-1 w-full rounded border px-3 py-2"></label>
          <div class="sm:col-span-2"><SaveFeedback :state="englishState" :message="englishMessage" /><button class="mt-3 rounded bg-stone-900 px-4 py-2 text-sm font-semibold text-white">英語訳を保存</button></div>
        </form>
      </section>
      <section class="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <SpotPhotoManager
          :map-id="mapId"
          :spot-id="spotId"
          :initial-photos="data.spot.photos"
          :initial-photo-asset-ids="data.spot.photoAssetIds"
          @updated="data.spot.photos = $event"
        />
      </section>
      <section class="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <PinDesignEditor
          :map-id="mapId"
          :spot-id="spotId"
          :initial-value="data.spot"
          @updated="Object.assign(data.spot, $event)"
        />
      </section>
      <section class="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <SpotPublishPanel
          :map-id="mapId"
          :spot-id="spotId"
          :spot="data.spot"
          @updated="Object.assign(data.spot, $event)"
        />
      </section>
      <DuplicateSpotDialog :open="duplicateMatches.length > 0" :matches="duplicateMatches" @cancel="cancelDuplicateWarning" @continue="continueWithDuplicate" />
    </template>
  </div>
</template>
