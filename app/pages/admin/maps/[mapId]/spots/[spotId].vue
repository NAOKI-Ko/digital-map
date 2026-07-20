<script setup lang="ts">
import PinDesignEditor from '~/components/admin/PinDesignEditor.vue'
import SpotPhotoManager from '~/components/admin/SpotPhotoManager.vue'
import SpotForm from '~/components/admin/SpotForm.vue'
import type { SpotFormInput } from '~~/shared/schemas/spot'
import type { AdminSpotResponse } from '~~/shared/types/spot'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const route = useRoute()
const mapId = route.params.mapId as string
const spotId = route.params.spotId as string
const { data, error, status } = await useFetch<AdminSpotResponse>(`/api/maps/${mapId}/spots/${spotId}`)
const isSubmitting = ref(false)
const submitError = ref('')
const successMessage = ref('')

const initialValue = computed<SpotFormInput | undefined>(() => data.value
  ? {
      floorId: data.value.spot.floorId,
      name: data.value.spot.name,
      category: data.value.spot.category,
      description: data.value.spot.description ?? '',
      hoursText: data.value.spot.hoursText ?? '',
      holidayText: data.value.spot.holidayText ?? '',
      phone: data.value.spot.phone ?? '',
      lat: data.value.spot.lat,
      lng: data.value.spot.lng,
    }
  : undefined)

useHead(() => ({ title: `${data.value?.spot.name ?? 'スポット編集'} | デジタルマップ` }))

async function updateSpot(input: SpotFormInput) {
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
</script>

<template>
  <div class="max-w-4xl">
    <NuxtLink :to="`/admin/maps/${mapId}/spots`" class="text-sm font-medium text-stone-600 hover:text-stone-900">← スポット一覧に戻る</NuxtLink>
    <div v-if="status === 'pending'" class="mt-8 rounded-xl bg-white p-8 text-sm text-stone-600">読み込んでいます…</div>
    <div v-else-if="error || !data || !initialValue" class="mt-8 rounded-xl bg-red-50 p-8 text-sm text-red-700">スポットが見つかりません。</div>
    <template v-else>
      <header class="mt-5">
        <p class="text-sm font-medium text-terracotta-700">スポット編集</p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">{{ data.spot.name }}</h1>
        <p class="mt-2 text-sm text-stone-600">基本情報や営業情報を編集します。</p>
      </header>
      <div v-if="submitError" role="alert" class="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{{ submitError }}</div>
      <div v-if="successMessage" role="status" class="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{{ successMessage }}</div>
      <section class="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <SpotForm :floors="data.floors" :initial-value="initialValue" :is-submitting="isSubmitting" @submit="updateSpot" />
      </section>
      <section class="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <SpotPhotoManager
          :map-id="mapId"
          :spot-id="spotId"
          :initial-photos="data.spot.photos"
          @updated="data.spot.photos = $event"
        />
      </section>
      <section class="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <PinDesignEditor
          :map-id="mapId"
          :spot-id="spotId"
          :category="data.spot.category"
          :initial-value="data.spot"
          @updated="Object.assign(data.spot, $event)"
        />
      </section>
    </template>
  </div>
</template>
