<script setup lang="ts">
import CategoryIconEditor from '~/components/admin/CategoryIconEditor.vue'
import AppDialog from '~/components/ui/AppDialog.vue'
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue'
import type { CategoryIconType } from '~~/shared/constants/category'
import { categoryUpdateSchema } from '~~/shared/schemas/category'
import type { CategoryListResponse, CategoryResponse, CategorySummary } from '~~/shared/types/category'

interface CategoryIconDraft {
  iconType: CategoryIconType | null
  iconPresetId: string | null
  iconImageUrl: string | null
}

definePageMeta({ layout: 'admin', middleware: 'auth' })
const route = useRoute()
const mapId = route.params.mapId as string
const uploadUrl = `/api/maps/${mapId}/category-icons`
const { data, error, refresh } = await useFetch<CategoryListResponse>(`/api/maps/${mapId}/categories`)
const newName = ref('')
const newIcon = ref<CategoryIconDraft>({ iconType: null, iconPresetId: null, iconImageUrl: null })
const editingId = ref<string | null>(null)
const editName = ref('')
const editIcon = ref<CategoryIconDraft>({ iconType: null, iconPresetId: null, iconImageUrl: null })
const editError = ref('')
const deleteTarget = ref<CategorySummary | null>(null)
const message = ref('')
const isSaving = ref(false)

useHead({ title: 'カテゴリー管理 | デジタルマップ' })

async function createCategory() {
  isSaving.value = true
  message.value = ''
  try {
    await $fetch<CategoryResponse>(`/api/maps/${mapId}/categories`, { method: 'POST', body: { name: newName.value, ...newIcon.value } })
    newName.value = ''
    newIcon.value = { iconType: null, iconPresetId: null, iconImageUrl: null }
    await refresh()
  }
  catch (error: any) { message.value = error?.data?.statusMessage ?? 'カテゴリーを追加できませんでした。' }
  finally { isSaving.value = false }
}

function startEditing(category: CategorySummary) {
  editingId.value = category.id
  editName.value = category.name
  editIcon.value = {
    iconType: category.iconType === 'preset' || category.iconType === 'custom' ? category.iconType : null,
    iconPresetId: category.iconPresetId,
    iconImageUrl: category.iconImageUrl,
  }
  message.value = ''
  editError.value = ''
}

function closeEditor() {
  if (isSaving.value) return
  editingId.value = null
  editError.value = ''
}

function handleEditEnter(event: KeyboardEvent) {
  event.preventDefault()
  if (event.isComposing) return
  void saveCategory()
}

async function saveCategory() {
  const category = data.value?.categories.find(item => item.id === editingId.value)
  if (!category) return
  const result = categoryUpdateSchema.safeParse({ name: editName.value, ...editIcon.value })
  if (!result.success) {
    editError.value = result.error.issues[0]?.message ?? '入力内容を確認してください。'
    return
  }
  isSaving.value = true
  editError.value = ''
  try {
    await $fetch(`/api/maps/${mapId}/categories/${category.id}`, { method: 'PATCH', body: result.data })
    editingId.value = null
    await refresh()
  }
  catch (error: any) { editError.value = error?.data?.statusMessage ?? 'カテゴリーを変更できませんでした。' }
  finally { isSaving.value = false }
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

async function deleteCategory() {
  const category = deleteTarget.value
  if (!category) return
  isSaving.value = true
  try {
    await $fetch(`/api/maps/${mapId}/categories/${category.id}`, { method: 'DELETE' })
    deleteTarget.value = null
    await refresh()
  }
  catch (error: any) { message.value = error?.data?.statusMessage ?? 'カテゴリーを削除できませんでした。' }
  finally { isSaving.value = false }
}
</script>

<template>
  <div class="max-w-4xl">
    <NuxtLink :to="`/admin/maps/${mapId}/settings`" class="text-sm font-medium text-stone-600 hover:text-stone-900">← マップ設定に戻る</NuxtLink>
    <header class="mt-5"><p class="text-sm font-medium text-terracotta-700">マップ設定</p><h1 class="mt-1 text-3xl font-bold text-stone-900">カテゴリー管理</h1><p class="mt-2 text-sm text-stone-600">カテゴリー名・アイコン・並び順を一元管理します。カテゴリーアイコンはスポットのPINデザインには影響しません。</p></header>
    <p v-if="message" role="alert" class="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{{ message }}</p>
    <form class="mt-8 space-y-5 rounded-2xl border border-stone-200 bg-white p-5" @submit.prevent="createCategory">
      <div><label for="new-category-name" class="text-sm font-semibold text-stone-800">新しいカテゴリー名</label><input id="new-category-name" v-model="newName" maxlength="50" required class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5" placeholder="カテゴリー名"></div>
      <CategoryIconEditor v-model="newIcon" :upload-url="uploadUrl" />
      <div class="flex justify-end"><button :disabled="isSaving" class="rounded-lg bg-terracotta-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">追加</button></div>
    </form>
    <div v-if="error" class="mt-6 rounded-lg bg-red-50 p-5 text-sm text-red-700">カテゴリーを読み込めませんでした。</div>
    <ul v-else class="mt-6 space-y-3">
      <li v-for="(category, index) in data?.categories" :key="category.id" class="rounded-xl border border-stone-200 bg-white p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <span class="grid size-10 shrink-0 place-items-center rounded-lg bg-stone-100 text-stone-700"><CategoryIcon :icon-type="category.iconType" :icon-preset-id="category.iconPresetId" :icon-image-url="category.iconImageUrl" size="lg" /><span v-if="!category.iconType" aria-hidden="true" class="text-xs text-stone-400">なし</span></span>
            <div><strong>{{ category.name }}</strong><span class="ml-3 text-sm text-stone-500">{{ category.spotCount }}スポットで使用</span></div>
          </div>
          <div class="flex gap-2">
            <button type="button" :disabled="index === 0" class="rounded border px-3 py-1.5 disabled:opacity-30" aria-label="上へ移動" @click="moveCategory(index, -1)">↑</button>
            <button type="button" :disabled="index === (data?.categories.length ?? 0) - 1" class="rounded border px-3 py-1.5 disabled:opacity-30" aria-label="下へ移動" @click="moveCategory(index, 1)">↓</button>
            <button type="button" class="rounded border px-3 py-1.5" @click="startEditing(category)">編集</button>
            <button type="button" :disabled="category.spotCount > 0" class="rounded border border-red-200 px-3 py-1.5 text-red-700 disabled:opacity-40" @click="deleteTarget = category">削除</button>
          </div>
        </div>
      </li>
    </ul>

    <AppDialog :open="editingId !== null" title="カテゴリー名を編集" description="カテゴリー名とアイコンを変更できます。" max-width="lg" @close="closeEditor">
      <form class="space-y-5" @submit.prevent="saveCategory" @keydown.enter="handleEditEnter">
        <div><label for="edit-category-name" class="text-sm font-semibold text-stone-800">カテゴリー名</label><input id="edit-category-name" v-model="editName" autofocus maxlength="50" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta-600"></div>
        <CategoryIconEditor v-model="editIcon" :upload-url="uploadUrl" />
        <p v-if="editError" role="alert" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ editError }}</p>
        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" :disabled="isSaving" class="rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold" @click="closeEditor">キャンセル</button><button :disabled="isSaving" class="rounded-lg bg-terracotta-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{{ isSaving ? '保存中…' : '保存' }}</button></div>
      </form>
    </AppDialog>

    <ConfirmDialog :open="deleteTarget !== null" title="カテゴリーを削除" :message="deleteTarget ? `「${deleteTarget.name}」を削除します。元に戻せません。` : ''" confirm-label="削除する" destructive :busy="isSaving" @cancel="deleteTarget = null" @confirm="deleteCategory" />
  </div>
</template>
