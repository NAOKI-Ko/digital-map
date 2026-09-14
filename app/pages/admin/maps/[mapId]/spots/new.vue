<script setup lang="ts">
import SaveFeedback from '~/components/ui/SaveFeedback.vue'
import SpotForm from '~/components/admin/SpotForm.vue'
import DuplicateSpotDialog from '~/components/admin/DuplicateSpotDialog.vue'
import { createMapEditorReturnQuery, resolveMapEditorReturnContext } from '~/utils/map-editor-camera'
import type { SpotFormInput } from '~~/shared/schemas/spot'
import type { MapFloorListResponse } from '~~/shared/types/floor'
import type { CategoryListResponse } from '~~/shared/types/category'
import type { AdminSpotResponse } from '~~/shared/types/spot'
import type { SpotFieldDefinitionListResponse } from '~~/shared/types/spot-field'
import type { SpotDuplicateMatch, SpotDuplicateResponse } from '~~/shared/types/spot-duplicate'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const route = useRoute()
const mapId = route.params.mapId as string
const { data } = await useFetch<MapFloorListResponse>(`/api/maps/${mapId}/floors`)
const { data: categoryData } = await useFetch<CategoryListResponse>(`/api/maps/${mapId}/categories`)
const { data: fieldData } = await useFetch<SpotFieldDefinitionListResponse>(`/api/maps/${mapId}/spot-fields`)
const floors = computed(() => data.value?.floors.map(floor => ({ id: floor.id, name: floor.name })) ?? [])
const returnContext = computed(() => resolveMapEditorReturnContext(
  route.query,
  floors.value.map(floor => floor.id),
))
const editorReturnLocation = computed(() => returnContext.value
  ? {
      path: `/admin/maps/${mapId}/editor`,
      query: createMapEditorReturnQuery(returnContext.value),
    }
  : null)

function parseCoordinate(value: unknown) {
  if (typeof value !== 'string' || value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : null
}

const initialValue = computed<SpotFormInput>(() => {
  const requestedFloorId = typeof route.query.floorId === 'string' ? route.query.floorId : ''
  const requestedX = parseCoordinate(route.query.x)
  const requestedY = parseCoordinate(route.query.y)
  return {
    floorId: floors.value.some(floor => floor.id === requestedFloorId) ? requestedFloorId : '',
    name: '',
    categoryIds: [],
    importance: 'normal',
    description: '',
    address: '',
    website: '',
    hoursText: '',
    holidayText: '',
    phone: '',
    customValues: {},
    x: requestedX !== null && requestedY !== null ? requestedX : null,
    y: requestedX !== null && requestedY !== null ? requestedY : null,
  }
})
const isSubmitting = ref(false)
const submitError = ref('')
const duplicateMatches = ref<SpotDuplicateMatch[]>([])
const pendingInput = ref<SpotFormInput | null>(null)

useHead({ title: '新しいスポット | デジタルマップ' })

async function createSpot(input: SpotFormInput) {
  isSubmitting.value = true
  submitError.value = ''
  try {
    const duplicateResponse = await $fetch<SpotDuplicateResponse>(`/api/maps/${mapId}/spots/duplicates`, {
      query: { name: input.name },
    })
    if (duplicateResponse.matches.length) {
      pendingInput.value = input
      duplicateMatches.value = duplicateResponse.matches
      return
    }
    await persistSpot(input)
  }
  catch {
    submitError.value = 'スポットを登録できませんでした。入力内容を確認してください。'
  }
  finally {
    isSubmitting.value = false
  }
}

async function persistSpot(input: SpotFormInput) {
  isSubmitting.value = true
  submitError.value = ''
  try {
    const response = await $fetch<AdminSpotResponse>(`/api/maps/${mapId}/spots`, { method: 'POST', body: input })
    await navigateTo(editorReturnLocation.value
      ? { ...editorReturnLocation.value, query: { ...editorReturnLocation.value.query, saved: 'spot-created' } }
      : { path: `/admin/maps/${mapId}/spots/${response.spot.id}`, query: { saved: 'spot-created' } }, { external: true })
  }
  catch {
    submitError.value = 'スポットを登録できませんでした。入力内容を確認してください。'
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
</script>

<template>
  <div class="max-w-4xl">
    <NuxtLink :to="editorReturnLocation ?? `/admin/maps/${mapId}/spots`" class="text-sm font-medium text-stone-600 hover:text-stone-900">{{ editorReturnLocation ? '← ピン配置エディタに戻る' : '← スポット一覧に戻る' }}</NuxtLink>
    <header class="mt-5">
      <p class="text-sm font-medium text-terracotta-700">スポット管理</p>
      <h1 class="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">新しいスポット</h1>
      <p class="mt-2 text-sm text-stone-600">店名や営業情報、所属フロアを登録します。</p>
    </header>
    <div v-if="floors.length === 0" class="mt-8 rounded-xl bg-amber-50 p-6 text-sm text-amber-800">先にフロアを1件以上登録してください。</div>
    <SaveFeedback class="mt-6" :state="isSubmitting ? 'saving' : submitError ? 'error' : 'idle'" :message="submitError" />
    <section class="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <ClientOnly>
        <SpotForm :floors="floors" :categories="categoryData?.categories ?? []" :fields="fieldData?.fields ?? []" :initial-value="initialValue" :is-submitting="isSubmitting" submit-label="スポットを登録する" @submit="createSpot" />
        <template #fallback>
          <p class="text-sm text-stone-600">フォームを読み込んでいます…</p>
        </template>
      </ClientOnly>
    </section>
    <DuplicateSpotDialog :open="duplicateMatches.length > 0" :matches="duplicateMatches" @cancel="cancelDuplicateWarning" @continue="continueWithDuplicate" />
  </div>
</template>
