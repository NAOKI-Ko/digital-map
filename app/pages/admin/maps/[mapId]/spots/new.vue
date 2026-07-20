<script setup lang="ts">
import SpotForm from '~/components/admin/SpotForm.vue'
import type { SpotFormInput } from '~~/shared/schemas/spot'
import type { MapFloorListResponse } from '~~/shared/types/floor'
import type { AdminSpotResponse } from '~~/shared/types/spot'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const route = useRoute()
const mapId = route.params.mapId as string
const { data } = await useFetch<MapFloorListResponse>(`/api/maps/${mapId}/floors`)
const floors = computed(() => data.value?.floors.map(floor => ({ id: floor.id, name: floor.name })) ?? [])

function parseCoordinate(value: unknown, minimum: number, maximum: number) {
  if (typeof value !== 'string' || value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum ? parsed : null
}

const initialValue = computed<SpotFormInput>(() => {
  const requestedFloorId = typeof route.query.floorId === 'string' ? route.query.floorId : ''
  const requestedLat = parseCoordinate(route.query.lat, -90, 90)
  const requestedLng = parseCoordinate(route.query.lng, -180, 180)
  return {
    floorId: floors.value.some(floor => floor.id === requestedFloorId) ? requestedFloorId : '',
    name: '',
    category: '',
    description: '',
    hoursText: '',
    holidayText: '',
    phone: '',
    lat: requestedLat !== null && requestedLng !== null ? requestedLat : null,
    lng: requestedLat !== null && requestedLng !== null ? requestedLng : null,
  }
})
const isSubmitting = ref(false)
const submitError = ref('')

useHead({ title: '新しいスポット | デジタルマップ' })

async function createSpot(input: SpotFormInput) {
  isSubmitting.value = true
  submitError.value = ''
  try {
    const response = await $fetch<AdminSpotResponse>(`/api/maps/${mapId}/spots`, { method: 'POST', body: input })
    await navigateTo(`/admin/maps/${mapId}/spots/${response.spot.id}`)
  }
  catch {
    submitError.value = 'スポットを登録できませんでした。入力内容を確認してください。'
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl">
    <NuxtLink :to="`/admin/maps/${mapId}/spots`" class="text-sm font-medium text-stone-600 hover:text-stone-900">← スポット一覧に戻る</NuxtLink>
    <header class="mt-5">
      <p class="text-sm font-medium text-terracotta-700">スポット管理</p>
      <h1 class="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">新しいスポット</h1>
      <p class="mt-2 text-sm text-stone-600">店名や営業情報、所属フロアを登録します。</p>
    </header>
    <div v-if="floors.length === 0" class="mt-8 rounded-xl bg-amber-50 p-6 text-sm text-amber-800">先にフロアを1件以上登録してください。</div>
    <div v-if="submitError" role="alert" class="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{{ submitError }}</div>
    <section class="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <SpotForm :floors="floors" :initial-value="initialValue" :is-submitting="isSubmitting" submit-label="スポットを登録する" @submit="createSpot" />
    </section>
  </div>
</template>
