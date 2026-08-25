<script setup lang="ts">
import type { AdminSpotListResponse } from '~~/shared/types/spot'
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const route = useRoute()
const mapId = route.params.mapId as string
const form = reactive({ q: '', categoryId: '', floorId: '', status: '' })
const appliedFilters = ref({ ...form })
const query = computed(() => Object.fromEntries(
  Object.entries(appliedFilters.value).filter(([, value]) => value),
))
const { data, error, status, refresh } = await useFetch<AdminSpotListResponse>(`/api/maps/${mapId}/spots`, {
  query,
})
const selectedSpotIds = ref<string[]>([])
const bulkCategoryIds = ref<string[]>([])
const bulkMessage = ref('')
const isBulkSaving = ref(false)
const bulkDeleteOpen = ref(false)
const allCurrentSelected = computed(() => Boolean(data.value?.spots.length) && data.value!.spots.every(spot => selectedSpotIds.value.includes(spot.id)))

useHead({ title: 'スポット一覧 | デジタルマップ' })

function search() {
  appliedFilters.value = { ...form, q: form.q.trim() }
}

function reset() {
  Object.assign(form, { q: '', categoryId: '', floorId: '', status: '' })
  appliedFilters.value = { ...form }
}

function toggleAllCurrent() {
  selectedSpotIds.value = allCurrentSelected.value ? [] : data.value?.spots.map(spot => spot.id) ?? []
}

async function runBulk(action: 'delete' | 'publish' | 'unpublish' | 'setCategories') {
  if (!selectedSpotIds.value.length) return
  if (action === 'delete') {
    bulkDeleteOpen.value = true
    return
  }
  await executeBulk(action)
}

async function executeBulk(action: 'delete' | 'publish' | 'unpublish' | 'setCategories') {
  isBulkSaving.value = true
  bulkMessage.value = ''
  try {
    await $fetch(`/api/maps/${mapId}/spots/bulk`, {
      method: 'PATCH',
      body: { action, spotIds: selectedSpotIds.value, ...(action === 'setCategories' ? { categoryIds: bulkCategoryIds.value } : {}) },
    })
    bulkMessage.value = `${selectedSpotIds.value.length}件を更新しました。`
    selectedSpotIds.value = []
    bulkDeleteOpen.value = false
    await refresh()
  }
  catch (error: any) { bulkMessage.value = error?.data?.statusMessage ?? '一括操作を完了できませんでした。' }
  finally { isBulkSaving.value = false }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium' }).format(new Date(value))
}
</script>

<template>
  <div class="max-w-6xl">
    <NuxtLink :to="`/admin/maps/${mapId}/settings`" class="text-sm font-medium text-stone-600 hover:text-stone-900">← マップ設定に戻る</NuxtLink>

    <header class="mt-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm font-medium text-terracotta-700">スポット管理</p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">スポット一覧</h1>
        <p class="mt-2 text-sm text-stone-600">店名・カテゴリを検索し、フロアや公開状態で絞り込めます。</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <NuxtLink :to="`/admin/maps/${mapId}/spots/new`" class="rounded-lg bg-terracotta-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-terracotta-700">情報からスポット登録</NuxtLink>
        <NuxtLink :to="`/admin/maps/${mapId}/editor`" class="rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800">地図から登録・配置</NuxtLink>
      </div>
    </header>

    <form class="mt-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm" @submit.prevent="search">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="xl:col-span-2">
          <label for="spot-keyword" class="text-xs font-semibold text-stone-600">キーワード</label>
          <input id="spot-keyword" v-model="form.q" type="search" maxlength="100" class="mt-1.5 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm" placeholder="店名・カテゴリ・説明文を検索">
        </div>
        <div>
          <label for="spot-category" class="text-xs font-semibold text-stone-600">カテゴリ</label>
          <select id="spot-category" v-model="form.categoryId" class="mt-1.5 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm">
            <option value="">すべて</option>
            <option v-for="category in data?.filters.categories" :key="category.id" :value="category.id">{{ category.name }}</option>
          </select>
        </div>
        <div>
          <label for="spot-floor" class="text-xs font-semibold text-stone-600">フロア</label>
          <select id="spot-floor" v-model="form.floorId" class="mt-1.5 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm">
            <option value="">すべて</option>
            <option v-for="floor in data?.filters.floors" :key="floor.id" :value="floor.id">{{ floor.name }}</option>
          </select>
        </div>
        <div>
          <label for="spot-status" class="text-xs font-semibold text-stone-600">公開状態</label>
          <select id="spot-status" v-model="form.status" class="mt-1.5 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm">
            <option value="">すべて</option>
            <option value="published">公開</option>
            <option value="draft">下書き</option>
          </select>
        </div>
      </div>
      <div class="mt-4 flex flex-wrap justify-end gap-3">
        <button type="button" class="rounded-lg px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100" @click="reset">条件をクリア</button>
        <button type="submit" class="rounded-lg bg-stone-900 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-700">検索する</button>
      </div>
    </form>

    <section class="mt-6">
      <div class="mb-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div class="flex flex-wrap items-center gap-3">
          <button type="button" class="rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold" @click="toggleAllCurrent">{{ allCurrentSelected ? '選択解除' : '検索結果をすべて選択' }}</button>
          <span class="text-sm text-stone-600">{{ selectedSpotIds.length }}件選択中</span>
          <button type="button" :disabled="!selectedSpotIds.length || isBulkSaving" class="rounded-lg border px-3 py-2 text-sm disabled:opacity-40" @click="runBulk('publish')">公開</button>
          <button type="button" :disabled="!selectedSpotIds.length || isBulkSaving" class="rounded-lg border px-3 py-2 text-sm disabled:opacity-40" @click="runBulk('unpublish')">非公開</button>
          <button type="button" :disabled="!selectedSpotIds.length || isBulkSaving" class="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 disabled:opacity-40" @click="runBulk('delete')">削除</button>
        </div>
        <div class="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-200 pt-4">
          <span class="text-sm font-semibold">カテゴリーを置換:</span>
          <label v-for="category in data?.filters.categories" :key="category.id" class="flex items-center gap-1 text-sm"><input v-model="bulkCategoryIds" type="checkbox" :value="category.id">{{ category.name }}</label>
          <button type="button" :disabled="!selectedSpotIds.length || isBulkSaving" class="rounded-lg bg-stone-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40" @click="runBulk('setCategories')">適用</button>
        </div>
        <p v-if="bulkMessage" role="status" class="mt-3 text-sm text-stone-600">{{ bulkMessage }}</p>
      </div>
      <div class="flex items-center justify-between">
        <h2 class="font-bold text-stone-900">検索結果</h2>
        <span v-if="data" class="text-sm text-stone-500">{{ data.spots.length }}件</span>
      </div>

      <div v-if="status === 'pending'" class="mt-4 rounded-xl bg-white p-8 text-sm text-stone-600">読み込んでいます…</div>
      <div v-else-if="error" class="mt-4 rounded-xl bg-red-50 p-8 text-sm text-red-700">
        スポットを読み込めませんでした。
        <button type="button" class="ml-2 underline" @click="refresh()">再読み込み</button>
      </div>
      <div v-else-if="data?.spots.length === 0" class="mt-4 rounded-2xl border-2 border-dashed border-stone-300 bg-white p-10 text-center">
        <h2 class="font-bold text-stone-900">該当するスポットはありません</h2>
        <p class="mt-2 text-sm text-stone-600">条件を変えるか、最初のスポットを登録してください。</p>
      </div>
      <div v-else class="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <ul class="divide-y divide-stone-200">
          <li v-for="spot in data?.spots" :key="spot.id" class="p-5 hover:bg-stone-50">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="flex min-w-0 gap-3">
                <input v-model="selectedSpotIds" type="checkbox" :value="spot.id" :aria-label="`${spot.name}を選択`" class="mt-1 size-4">
                <div>
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="font-bold text-stone-900">{{ spot.name }}</h3>
                  <span v-if="spot.importance === 'featured'" class="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">注目</span>
                  <span v-for="category in spot.categories" :key="category.id" class="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-700">{{ category.name }}</span>
                  <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="spot.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'">{{ spot.isPublished ? '公開' : '下書き' }}</span>
                </div>
                <p v-if="spot.lat !== null && spot.lng !== null" class="mt-2 text-sm text-stone-600">{{ spot.floorName }} · lat {{ spot.lat.toFixed(6) }}, lng {{ spot.lng.toFixed(6) }}</p>
                <p v-else class="mt-2 text-sm font-medium text-amber-700">{{ spot.floorName }} · 位置未設定</p>
                <p class="mt-1 text-xs text-stone-500">最終更新 {{ formatDate(spot.updatedAt) }}</p>
                </div>
              </div>
              <NuxtLink :to="`/admin/maps/${mapId}/spots/${spot.id}`" class="text-sm font-semibold text-terracotta-700 hover:text-terracotta-900">編集する →</NuxtLink>
            </div>
          </li>
        </ul>
      </div>
    </section>
    <ConfirmDialog :open="bulkDeleteOpen" title="スポットを一括削除" :message="`選択した${selectedSpotIds.length}件のスポットを削除します。関連する写真やカテゴリー設定も登録から外れ、元に戻せません。`" confirm-label="削除する" destructive :busy="isBulkSaving" @cancel="bulkDeleteOpen = false" @confirm="executeBulk('delete')" />
  </div>
</template>
