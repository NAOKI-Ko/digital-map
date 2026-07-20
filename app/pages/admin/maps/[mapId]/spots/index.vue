<script setup lang="ts">
import type { AdminSpotListResponse } from '~~/shared/types/spot'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const route = useRoute()
const mapId = route.params.mapId as string
const form = reactive({ q: '', category: '', floorId: '', status: '' })
const appliedFilters = ref({ ...form })
const query = computed(() => Object.fromEntries(
  Object.entries(appliedFilters.value).filter(([, value]) => value),
))
const { data, error, status, refresh } = await useFetch<AdminSpotListResponse>(`/api/maps/${mapId}/spots`, {
  query,
})

useHead({ title: 'スポット一覧 | デジタルマップ' })

function search() {
  appliedFilters.value = { ...form, q: form.q.trim() }
}

function reset() {
  Object.assign(form, { q: '', category: '', floorId: '', status: '' })
  appliedFilters.value = { ...form }
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
      <NuxtLink :to="`/admin/maps/${mapId}/editor`" class="rounded-lg bg-terracotta-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-terracotta-700">新しいスポットを登録</NuxtLink>
    </header>

    <form class="mt-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm" @submit.prevent="search">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="xl:col-span-2">
          <label for="spot-keyword" class="text-xs font-semibold text-stone-600">キーワード</label>
          <input id="spot-keyword" v-model="form.q" type="search" maxlength="100" class="mt-1.5 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm" placeholder="店名・カテゴリ・説明文を検索">
        </div>
        <div>
          <label for="spot-category" class="text-xs font-semibold text-stone-600">カテゴリ</label>
          <select id="spot-category" v-model="form.category" class="mt-1.5 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm">
            <option value="">すべて</option>
            <option v-for="category in data?.filters.categories" :key="category" :value="category">{{ category }}</option>
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
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="font-bold text-stone-900">{{ spot.name }}</h3>
                  <span class="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-700">{{ spot.category }}</span>
                  <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="spot.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'">{{ spot.isPublished ? '公開' : '下書き' }}</span>
                </div>
                <p v-if="spot.lat !== null && spot.lng !== null" class="mt-2 text-sm text-stone-600">{{ spot.floorName }} · lat {{ spot.lat.toFixed(6) }}, lng {{ spot.lng.toFixed(6) }}</p>
                <p v-else class="mt-2 text-sm font-medium text-amber-700">{{ spot.floorName }} · 位置未設定</p>
                <p class="mt-1 text-xs text-stone-500">最終更新 {{ formatDate(spot.updatedAt) }}</p>
              </div>
              <NuxtLink :to="`/admin/maps/${mapId}/spots/${spot.id}`" class="text-sm font-semibold text-terracotta-700 hover:text-terracotta-900">編集する →</NuxtLink>
            </div>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>
