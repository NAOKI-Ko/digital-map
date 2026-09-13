<script setup lang="ts">
import type { AdminMapResponse } from '~~/shared/types/map'
import type { MapFloorListResponse } from '~~/shared/types/floor'
import type { CategoryListResponse } from '~~/shared/types/category'

definePageMeta({ layout: 'admin', middleware: 'auth' })
const route = useRoute()
const mapId = route.params.mapId as string
const [{ data: mapData }, { data: floors }, { data: categories, refresh: refreshCategories }] = await Promise.all([
  useFetch<AdminMapResponse>(`/api/maps/${mapId}`),
  useFetch<MapFloorListResponse>(`/api/maps/${mapId}/floors`),
  useFetch<CategoryListResponse>(`/api/maps/${mapId}/categories`),
])
const tourismTemplates = ['観光', '飲食', '買い物', '宿泊', '交通', 'トイレ', '駐車場'] as const
const selectedTemplates = ref<string[]>([])
const customCategory = ref('')
const message = ref('')
const categorySaveState = ref<'idle' | 'saving' | 'success' | 'error'>('idle')

async function addCategories() {
  const names = [...new Set([...selectedTemplates.value, customCategory.value.trim()].filter(Boolean))]
    .filter(name => !categories.value?.categories.some(category => category.name === name))
  try {
    categorySaveState.value = 'saving'
    for (const [index, name] of names.entries()) {
      await $fetch(`/api/maps/${mapId}/categories`, {
        method: 'POST',
        body: { name, order: (categories.value?.categories.length ?? 0) + index },
      })
    }
    await refreshCategories()
    selectedTemplates.value = []
    customCategory.value = ''
    message.value = `${names.length}件のカテゴリーを追加しました。`
    categorySaveState.value = 'success'
  }
  catch {
    message.value = 'カテゴリーを追加できませんでした。'
    categorySaveState.value = 'error'
  }
}
</script>

<template>
  <div class="max-w-5xl">
    <p class="text-sm font-medium text-terracotta-700">イラストマップ セットアップ</p>
    <h1 class="mt-1 text-3xl font-bold">{{ mapData?.map.name ?? 'マップ' }}を準備する</h1>
    <p class="mt-2 text-sm text-stone-600">ジオリファレンスは任意です。イラスト、項を登録すれば、設定とSpot登録を進められます。</p>
    <SaveFeedback v-if="route.query.saved === 'map-created'" class="mt-5" state="success" message="マップを作成しました。セットアップを続けてください。" />

    <ol class="mt-8 grid gap-4 sm:grid-cols-2">
      <li class="rounded-2xl border bg-white p-5"><b>1. イラストを登録</b><p class="mt-2 text-sm text-stone-600">{{ floors?.floors.length ? `${floors.floors.length}フロア登録済み` : '未登録' }}</p><NuxtLink :to="`/admin/maps/${mapId}/floors`" class="mt-4 inline-flex text-sm font-semibold text-terracotta-700">フロアとイラストを設定 →</NuxtLink></li>
      <li class="rounded-2xl border bg-white p-5"><b>2. Categoryを設定</b><p class="mt-2 text-sm text-stone-600">{{ categories?.categories.length ?? 0 }}件登録済み</p></li>
      <li class="rounded-2xl border bg-white p-5"><b>3. Spot情報項目を確認</b><p class="mt-2 text-sm text-stone-600">標準の項目を作成済みです。</p><NuxtLink :to="`/admin/maps/${mapId}/fields`" class="mt-4 inline-flex text-sm font-semibold text-terracotta-700">項目を確認 →</NuxtLink></li>
      <li class="rounded-2xl border bg-white p-5"><b>4. Spotを登録</b><p class="mt-2 text-sm text-stone-600">イラスト登録後に配置できます。</p><NuxtLink :to="`/admin/maps/${mapId}/spots`" class="mt-4 inline-flex text-sm font-semibold text-terracotta-700">Spot管理へ →</NuxtLink></li>
    </ol>

    <section class="mt-6 rounded-2xl border bg-white p-6">
      <h2 class="font-bold">観光向けCategory候補（任意）</h2>
      <p class="mt-1 text-sm text-stone-600">必要なものだけ選んで追加します。自動追加はされません。</p>
      <div class="mt-4 flex flex-wrap gap-3"><label v-for="name in tourismTemplates" :key="name" class="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><input v-model="selectedTemplates" type="checkbox" :value="name">{{ name }}</label></div>
      <label class="mt-5 block text-sm font-semibold">独自Category<input v-model="customCategory" maxlength="50" class="mt-2 w-full max-w-sm rounded-lg border border-stone-300 px-3 py-2"></label>
      <button type="button" :disabled="!selectedTemplates.length && !customCategory.trim()" class="mt-4 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40" @click="addCategories">選択したCategoryを追加</button>
      <SaveFeedback class="mt-3" :state="categorySaveState" :message="message" />
    </section>

    <section class="mt-6 rounded-2xl border bg-white p-6">
      <h2 class="font-bold">後から設定できる項目</h2>
      <p class="mt-2 text-sm text-stone-600">ジオリファレンス、団体情報・ロゴ、Decorationは必要に応じて追加できます。</p>
      <NuxtLink :to="`/admin/maps/${mapId}/settings`" class="mt-4 inline-flex rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold">マップ設定を開く</NuxtLink>
    </section>
  </div>
</template>
