<script setup lang="ts">
import type { CategoryListResponse, CategoryResponse, CategorySummary } from '~~/shared/types/category'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const route = useRoute()
const mapId = route.params.mapId as string
const { data, error, refresh } = await useFetch<CategoryListResponse>(`/api/maps/${mapId}/categories`)
const newName = ref('')
const message = ref('')
const isSaving = ref(false)

useHead({ title: 'カテゴリー管理 | デジタルマップ' })

async function createCategory() {
  isSaving.value = true
  message.value = ''
  try {
    await $fetch<CategoryResponse>(`/api/maps/${mapId}/categories`, { method: 'POST', body: { name: newName.value } })
    newName.value = ''
    await refresh()
  }
  catch (error: any) {
    message.value = error?.data?.statusMessage ?? 'カテゴリーを追加できませんでした。'
  }
  finally { isSaving.value = false }
}

async function renameCategory(category: CategorySummary) {
  const name = window.prompt('新しいカテゴリー名', category.name)
  if (name === null) return
  try {
    await $fetch(`/api/maps/${mapId}/categories/${category.id}`, { method: 'PATCH', body: { name } })
    await refresh()
  }
  catch (error: any) { message.value = error?.data?.statusMessage ?? 'カテゴリー名を変更できませんでした。' }
}

async function moveCategory(index: number, direction: -1 | 1) {
  const categories = data.value?.categories
  const target = index + direction
  if (!categories || target < 0 || target >= categories.length) return
  const current = categories[index]!
  const other = categories[target]!
  await Promise.all([
    $fetch(`/api/maps/${mapId}/categories/${current.id}`, { method: 'PATCH', body: { order: other.order } }),
    $fetch(`/api/maps/${mapId}/categories/${other.id}`, { method: 'PATCH', body: { order: current.order } }),
  ])
  await refresh()
}

async function deleteCategory(category: CategorySummary) {
  if (!window.confirm(`「${category.name}」を削除しますか？`)) return
  try {
    await $fetch(`/api/maps/${mapId}/categories/${category.id}`, { method: 'DELETE' })
    await refresh()
  }
  catch (error: any) { message.value = error?.data?.statusMessage ?? 'カテゴリーを削除できませんでした。' }
}
</script>

<template>
  <div class="max-w-4xl">
    <NuxtLink :to="`/admin/maps/${mapId}/settings`" class="text-sm font-medium text-stone-600 hover:text-stone-900">← マップ設定に戻る</NuxtLink>
    <header class="mt-5">
      <p class="text-sm font-medium text-terracotta-700">マップ設定</p>
      <h1 class="mt-1 text-3xl font-bold text-stone-900">カテゴリー管理</h1>
      <p class="mt-2 text-sm text-stone-600">スポットで再利用するカテゴリーを一元管理します。</p>
    </header>
    <p v-if="message" role="alert" class="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{{ message }}</p>
    <form class="mt-8 flex gap-3 rounded-2xl border border-stone-200 bg-white p-5" @submit.prevent="createCategory">
      <input v-model="newName" maxlength="50" required class="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2.5" placeholder="カテゴリー名">
      <button :disabled="isSaving" class="rounded-lg bg-terracotta-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">追加</button>
    </form>
    <div v-if="error" class="mt-6 rounded-lg bg-red-50 p-5 text-sm text-red-700">カテゴリーを読み込めませんでした。</div>
    <ul v-else class="mt-6 space-y-3">
      <li v-for="(category, index) in data?.categories" :key="category.id" class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4">
        <div><strong>{{ category.name }}</strong><span class="ml-3 text-sm text-stone-500">{{ category.spotCount }}スポットで使用</span></div>
        <div class="flex gap-2">
          <button :disabled="index === 0" class="rounded border px-3 py-1.5 disabled:opacity-30" @click="moveCategory(index, -1)">↑</button>
          <button :disabled="index === (data?.categories.length ?? 0) - 1" class="rounded border px-3 py-1.5 disabled:opacity-30" @click="moveCategory(index, 1)">↓</button>
          <button class="rounded border px-3 py-1.5" @click="renameCategory(category)">名称変更</button>
          <button :disabled="category.spotCount > 0" class="rounded border border-red-200 px-3 py-1.5 text-red-700 disabled:opacity-40" @click="deleteCategory(category)">削除</button>
        </div>
      </li>
    </ul>
  </div>
</template>
