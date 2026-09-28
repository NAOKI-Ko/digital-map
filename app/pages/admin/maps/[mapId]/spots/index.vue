<script setup lang="ts">
import type { AdminSpotListResponse } from '~~/shared/types/spot'
import SpotPhotoDialog from '~/components/admin/SpotPhotoDialog.vue'
import SpotBulkDialog from '~/components/admin/SpotBulkDialog.vue'
import { pinSourceLabel } from '~~/shared/utils/pin-appearance'
import type { AdminSpotSummary } from '~~/shared/types/spot'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const route = useRoute()
const mapId = route.params.mapId as string
const form = reactive({
  q: typeof route.query.q === 'string' ? route.query.q : '',
  categoryId: typeof route.query.categoryId === 'string' ? route.query.categoryId : '',
  floorId: typeof route.query.floorId === 'string' ? route.query.floorId : '',
  status: typeof route.query.status === 'string' ? route.query.status : '',
  position: typeof route.query.position === 'string' ? route.query.position : '',
  photo: typeof route.query.photo === 'string' ? route.query.photo : '',
  pinSource: typeof route.query.pinSource === 'string' ? route.query.pinSource : '',
  pinSourceCategoryId: typeof route.query.pinSourceCategoryId === 'string' ? route.query.pinSourceCategoryId : '',
  sort: typeof route.query.sort === 'string' ? route.query.sort : 'updated',
})
const appliedFilters = ref({ ...form })
const query = computed(() => Object.fromEntries(
  Object.entries(appliedFilters.value).filter(([, value]) => value),
))
const { data, error, status, refresh } = await useFetch<AdminSpotListResponse>(`/api/maps/${mapId}/spots`, {
  query,
})
const selectedSpotIds = ref<string[]>([])
const photoSpotId = ref('')
const bulkSnapshot = ref<AdminSpotSummary[] | null>(null)
const bulkMessage = ref('')
const isBulkSaving = computed(() => bulkSnapshot.value !== null)
const allCurrentSelected = computed(() => Boolean(data.value?.spots.length) && data.value!.spots.every(spot => selectedSpotIds.value.includes(spot.id)))
let searchTimer: ReturnType<typeof setTimeout> | null = null

useHead({ title: 'スポット一覧 | デジタルマップ' })

function search() {
  if (bulkSnapshot.value) return
  if (selectedSpotIds.value.length) bulkMessage.value = '検索条件の変更により選択を解除しました。'
  selectedSpotIds.value = []
  appliedFilters.value = { ...form, q: form.q.trim() }
  void navigateTo({ path: route.path, query: query.value }, { replace: true })
}

function reset() {
  Object.assign(form, { q: '', categoryId: '', floorId: '', status: '', position: '', photo: '', pinSource: '', pinSourceCategoryId: '', sort: 'updated' })
  search()
}

watch(form, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(search, 250)
}, { deep: true })

onMounted(() => {
  const saved = sessionStorage.getItem(`spot-list-scroll:${mapId}`)
  if (saved) requestAnimationFrame(() => window.scrollTo({ top: Number(saved) || 0 }))
})
onBeforeRouteLeave(() => sessionStorage.setItem(`spot-list-scroll:${mapId}`, String(window.scrollY)))
onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = null
})

function spotDetailLocation(spotId: string) {
  return { path: `/admin/maps/${mapId}/spots/${spotId}`, query: { returnTo: route.fullPath } }
}

function toggleAllCurrent() {
  if ((data.value?.spots.length ?? 0) > 100) return
  selectedSpotIds.value = allCurrentSelected.value ? [] : data.value?.spots.map(spot => spot.id) ?? []
}

function openBulk() {
  if (searchTimer) clearTimeout(searchTimer)
  bulkSnapshot.value = structuredClone(toRaw(data.value?.spots.filter(spot => selectedSpotIds.value.includes(spot.id)) ?? []))
}
async function bulkSaved(message: string) {
  bulkSnapshot.value = null; selectedSpotIds.value = []; bulkMessage.value = message; await refresh()
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium' }).format(new Date(value))
}
</script>

<template>
  <div class="max-w-6xl">
    <AdminSubnavigation :map-id="mapId" area="spot" />

    <header class="mt-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm font-medium text-terracotta-700">スポット管理</p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">スポット一覧</h1>
      </div>
      <div class="flex flex-wrap gap-2">
        <NuxtLink :to="`/admin/maps/${mapId}/spots/new`" class="rounded-lg bg-terracotta-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-terracotta-700">新規スポット</NuxtLink>
        <NuxtLink :to="`/admin/maps/${mapId}/spots/import`" class="rounded-lg border px-4 py-2.5 text-sm font-semibold">CSVでまとめて登録・更新</NuxtLink>
        <NuxtLink :to="`/admin/maps/${mapId}/editor`" class="rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800">地図から登録・配置</NuxtLink>
      </div>
    </header>

    <div class="mt-4 flex flex-wrap gap-3 text-sm" aria-label="スポット準備の作業">
      <button type="button" class="min-h-11 underline" @click="Object.assign(form, { position: 'unpositioned', status: '', photo: '' })">未配置を確認</button>
      <button type="button" class="min-h-11 underline" @click="Object.assign(form, { position: 'positioned', status: 'draft', photo: '' })">配置済み・公開対象外を確認</button>
      <button type="button" class="min-h-11 underline" @click="Object.assign(form, { photo: 'none', position: '', status: '' })">写真なしを確認（任意）</button>
      <NuxtLink :to="`/admin/maps/${mapId}/preview`" class="inline-flex min-h-11 items-center underline">閲覧者向けプレビュー</NuxtLink>
    </div>
    <form class="mt-6 border-y border-stone-200 py-4" @submit.prevent="search">
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div class="col-span-2">
          <label for="spot-keyword" class="text-xs font-semibold text-stone-600">キーワード</label>
          <input id="spot-keyword" v-model="form.q" type="search" maxlength="100" class="mt-1.5 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm" placeholder="スポット名・カテゴリー・説明文を検索">
        </div>
        <div>
          <label for="spot-category" class="text-xs font-semibold text-stone-600">カテゴリー</label>
          <UiSelect id="spot-category" v-model="form.categoryId" class="mt-1.5" label="カテゴリー" :options="[{ value: '', label: 'すべて' }, ...(data?.filters.categories ?? []).map(category => ({ value: category.id, label: category.name }))]" />
        </div>
        <div><label for="spot-position" class="text-xs font-semibold text-stone-600">配置状態</label><UiSelect id="spot-position" v-model="form.position" class="mt-1.5" label="配置状態" :options="[{ value: '', label: 'すべて' }, { value: 'positioned', label: '配置済み' }, { value: 'unpositioned', label: '位置未設定' }]" /></div>
      </div>
      <div class="mt-3 flex flex-wrap items-start justify-between gap-3">
      <details class="min-w-0 flex-1" :open="Boolean(form.floorId || form.status || form.photo || form.sort !== 'updated')">
        <summary class="w-fit cursor-pointer py-2 text-sm font-medium text-stone-600">詳細条件</summary>
        <div class="mt-2 grid gap-3 sm:grid-cols-3">
        <div><label for="spot-pin-source" class="text-xs font-semibold text-stone-600">PINの設定元</label><UiSelect id="spot-pin-source" v-model="form.pinSource" class="mt-1.5" label="PINの設定元" :options="[{ value: '', label: 'すべて' }, { value: 'standard', label: '標準ピン' }, { value: 'category', label: 'カテゴリー既定' }, { value: 'individual', label: '個別設定' }]" /></div>
        <div><label for="spot-photo" class="text-xs font-semibold text-stone-600">写真</label><UiSelect id="spot-photo" v-model="form.photo" class="mt-1.5" label="写真" :options="[{ value: '', label: 'すべて' }, { value: 'none', label: '写真なし（任意）' }]" /></div>
        <div><label for="spot-sort" class="text-xs font-semibold text-stone-600">並び順</label><UiSelect id="spot-sort" v-model="form.sort" class="mt-1.5" label="並び順" :options="[{ value: 'updated', label: '更新が新しい順' }, { value: 'name', label: '名前順' }, { value: 'created', label: '作成が新しい順' }]" /></div>
        <div>
          <label for="spot-floor" class="text-xs font-semibold text-stone-600">フロア</label>
          <UiSelect id="spot-floor" v-model="form.floorId" class="mt-1.5" label="フロア" :options="[{ value: '', label: 'すべて' }, ...(data?.filters.floors ?? []).map(floor => ({ value: floor.id, label: floor.name }))]" />
        </div>
        <div>
          <label for="spot-status" class="text-xs font-semibold text-stone-600">公開対象</label>
          <UiSelect id="spot-status" v-model="form.status" class="mt-1.5" label="公開対象" :options="[{ value: '', label: 'すべて' }, { value: 'published', label: '公開対象' }, { value: 'draft', label: '公開対象外' }]" />
        </div>
        </div>
      </details>
      <div class="flex flex-wrap justify-end gap-3">
        <button type="button" class="rounded-lg px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100" @click="reset">条件をクリア</button>
        <button type="submit" class="rounded-lg bg-stone-900 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-700">検索する</button>
      </div>
      </div>
    </form>

    <section class="mt-6">
      <div class="mb-3">
        <div class="flex flex-wrap items-center gap-3">

          <span class="text-sm" aria-live="polite">{{ selectedSpotIds.length }}件選択中</span>
          <button type="button" :disabled="!selectedSpotIds.length || isBulkSaving" class="rounded border px-3 py-2 text-sm disabled:opacity-40" @click="openBulk">選択したスポットを一括操作</button>
          <button v-if="selectedSpotIds.length" type="button" :disabled="isBulkSaving" class="text-sm underline" @click="selectedSpotIds = []">選択を解除</button>
        </div>
        <p v-if="bulkMessage" role="status" class="mt-3 text-sm text-stone-700">{{ bulkMessage }}</p>
      </div>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4"><h2 class="font-bold text-stone-900">検索結果</h2><label class="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" :checked="allCurrentSelected" :indeterminate="selectedSpotIds.length > 0 && !allCurrentSelected" :disabled="!data?.spots.length || (data?.spots.length ?? 0) > 100 || isBulkSaving" @change="toggleAllCurrent">検索結果{{ data?.spots.length ?? 0 }}件を選択</label></div>
        <span v-if="data" class="text-sm text-stone-500">{{ data.spots.length }}件</span>
      </div>

      <p v-if="(data?.spots.length ?? 0) > 100" class="mt-2 text-sm text-stone-600">一括操作は100件までです。条件を絞るか100件以内を選択してください。</p>
      <div v-if="status === 'pending'" class="mt-4 rounded-xl bg-white p-8 text-sm text-stone-600">読み込んでいます…</div>
      <div v-else-if="error" class="mt-4 rounded-xl bg-red-50 p-8 text-sm text-red-700">
        スポットを読み込めませんでした。
        <button type="button" class="ml-2 underline" @click="refresh()">再読み込み</button>
      </div>
      <div v-else-if="data?.spots.length === 0" class="mt-4 rounded-2xl border-2 border-dashed border-stone-300 bg-white p-10 text-center">
        <h2 class="font-bold text-stone-900">該当するスポットはありません</h2>
        <p class="mt-2 text-sm text-stone-600">条件を変えるか、最初のスポットを登録してください。</p>
      </div>
      <div v-else class="mt-3 overflow-hidden border-y border-stone-200 bg-white">
        <ul class="divide-y divide-stone-200">
          <li v-for="spot in data?.spots" :key="spot.id" class="px-3 py-4 hover:bg-stone-50">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="flex min-w-0 gap-3">
                <input v-model="selectedSpotIds" type="checkbox" :value="spot.id" :disabled="isBulkSaving || (selectedSpotIds.length >= 100 && !selectedSpotIds.includes(spot.id))" :aria-label="`${spot.name}を選択`" class="mt-1 size-4">
                <div>
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="font-bold text-stone-900"><NuxtLink :to="spotDetailLocation(spot.id)" class="hover:text-terracotta-700">{{ spot.name }}</NuxtLink></h3>
                  <span v-if="spot.importance === 'featured'" class="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">注目</span>
                  <span v-for="category in spot.categories" :key="category.id" class="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-700">{{ category.name }}</span>
                  <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="spot.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'">{{ spot.isPublished ? '公開対象' : '公開対象外' }}</span>
                </div>
                <p v-if="spot.x !== null && spot.y !== null" class="mt-2 text-sm text-stone-600">{{ spot.floorName }} · 配置済み</p>
                <p v-else class="mt-2 text-sm font-medium text-amber-700">{{ spot.floorName }} · 位置未設定</p>
                <NuxtLink v-if="spot.x !== null && spot.y !== null" :to="{ path: `/admin/maps/${mapId}/editor`, query: { floorId: spot.floorId, placeSpotId: spot.id } }" class="mt-2 inline-flex text-xs font-semibold text-terracotta-700">地図上で識別</NuxtLink>
                <button type="button" class="mt-2 min-h-11 text-xs text-stone-600 underline" @click="photoSpotId = spot.id">{{ spot.photoCount ? `写真 ${spot.photoCount}枚を編集` : '写真を追加（任意）' }}</button>
                <p class="mt-1 text-xs text-stone-600">{{ pinSourceLabel(spot.pinSourceMode, spot.pinSourceCategoryName) }}</p>
                <p class="mt-1 text-xs text-stone-500">最終更新 {{ formatDate(spot.updatedAt) }}</p>
                </div>
              </div>
              <NuxtLink :to="spotDetailLocation(spot.id)" class="text-sm font-semibold text-terracotta-700 hover:text-terracotta-900">編集する →</NuxtLink>
            </div>
          </li>
        </ul>
      </div>
    </section>
    <SpotPhotoDialog v-if="photoSpotId" :key="photoSpotId" :map-id="mapId" :spot-id="photoSpotId" @close="photoSpotId = ''" @updated="refresh" />
    <SpotBulkDialog v-if="bulkSnapshot && data" :map-id="mapId" :spots="bulkSnapshot" :filters="data.filters" @close="bulkSnapshot = null" @saved="bulkSaved" />
  </div>
</template>
