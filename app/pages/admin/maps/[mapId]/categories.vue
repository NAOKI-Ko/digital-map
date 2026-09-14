<script setup lang="ts">
import CategoryIcon from '~/components/CategoryIcon.vue'
import SaveFeedback from '~/components/ui/SaveFeedback.vue'
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
  iconAssetId: string | null
}

definePageMeta({ layout: 'admin', middleware: 'auth' })
const route = useRoute()
const mapId = route.params.mapId as string
const { data, error, refresh } = await useFetch<CategoryListResponse>(`/api/maps/${mapId}/categories`)
const newName = ref('')
const newIcon = ref<CategoryIconDraft>({ iconType: null, iconPresetId: null, iconImageUrl: null, iconAssetId: null })
const editingId = ref<string | null>(null)
const editName = ref('')
const editIcon = ref<CategoryIconDraft>({ iconType: null, iconPresetId: null, iconImageUrl: null, iconAssetId: null })
const editError = ref('')
const deleteTarget = ref<CategorySummary | null>(null)
const message = ref('')
const saveState = ref<'idle' | 'saving' | 'success' | 'error'>('idle')
const isSaving = ref(false)

useHead({ title: 'カテゴリー管理 | デジタルマップ' })

async function createCategory() {
  isSaving.value = true
  message.value = ''
  saveState.value = 'saving'
  try {
    await $fetch<CategoryResponse>(`/api/maps/${mapId}/categories`, { method: 'POST', body: { name: newName.value, ...newIcon.value } })
    newName.value = ''
    newIcon.value = { iconType: null, iconPresetId: null, iconImageUrl: null, iconAssetId: null }
    await refresh()
    message.value = 'カテゴリーを追加しました。'
    saveState.value = 'success'
  }
  catch (error: any) {
    message.value = error?.data?.statusMessage ?? 'カテゴリーを追加できませんでした。'
    saveState.value = 'error'
  }
  finally { isSaving.value = false }
}

function startEditing(category: CategorySummary) {
  editingId.value = category.id
  editName.value = category.name
  editIcon.value = {
    iconType: category.iconType === 'preset' || category.iconType === 'custom' ? category.iconType : null,
    iconPresetId: category.iconPresetId,
    iconImageUrl: category.iconImageUrl,
    iconAssetId: category.iconAssetId ?? null,
  }
  message.value = ''
  saveState.value = 'idle'
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
  message.value = ''
  saveState.value = 'saving'
  try {
    await $fetch(`/api/maps/${mapId}/categories/${category.id}`, { method: 'PATCH', body: result.data })
    editingId.value = null
    await refresh()
    message.value = 'カテゴリーを保存しました。'
    saveState.value = 'success'
  }
  catch (error: any) {
    editError.value = error?.data?.statusMessage ?? 'カテゴリーを変更できませんでした。'
    message.value = editError.value
    saveState.value = 'error'
  }
  finally { isSaving.value = false }
}

async function moveCategory(index: number, direction: -1 | 1) {
  const categories = data.value?.categories
  const target = index + direction
  if (!categories || target < 0 || target >= categories.length) return
  const current = categories[index]!
  const other = categories[target]!
  isSaving.value = true
  message.value = ''
  saveState.value = 'saving'
  try {
    await Promise.all([
      $fetch(`/api/maps/${mapId}/categories/${current.id}`, { method: 'PATCH', body: { order: other.order } }),
      $fetch(`/api/maps/${mapId}/categories/${other.id}`, { method: 'PATCH', body: { order: current.order } }),
    ])
    await refresh()
    message.value = 'カテゴリーの並び順を保存しました。'
    saveState.value = 'success'
  }
  catch {
    message.value = 'カテゴリーの並び順を保存できませんでした。'
    saveState.value = 'error'
  }
  finally { isSaving.value = false }
}

async function deleteCategory() {
  const category = deleteTarget.value
  if (!category) return
  isSaving.value = true
  message.value = ''
  saveState.value = 'saving'
  try {
    await $fetch(`/api/maps/${mapId}/categories/${category.id}`, { method: 'DELETE' })
    deleteTarget.value = null
    await refresh()
    message.value = 'カテゴリーを削除しました。'
    saveState.value = 'success'
  }
  catch (error: any) {
    message.value = error?.data?.statusMessage ?? 'カテゴリーを削除できませんでした。'
    saveState.value = 'error'
  }
  finally { isSaving.value = false }
}

async function saveEnglishName(category: CategorySummary) {
  saveState.value = 'saving'
  try {
    await $fetch(`/api/maps/${mapId}/categories/${category.id}/translations`, { method: 'PATCH', body: { name: category.englishName || null } })
    message.value = 'カテゴリーの英語名を保存しました。'
    saveState.value = 'success'
  }
  catch { message.value = '英語名を保存できませんでした。'; saveState.value = 'error' }
}
</script>

<template>
  <div class="max-w-4xl">
    <NuxtLink :to="`/admin/maps/${mapId}/settings`" class="text-sm font-medium text-stone-600 hover:text-stone-900">← マップ設定に戻る</NuxtLink>
    <header class="mt-5"><p class="text-sm font-medium text-terracotta-700">マップ設定</p><h1 class="mt-1 text-3xl font-bold text-stone-900">カテゴリー管理</h1><p class="mt-2 text-sm text-stone-600">カテゴリー名・アイコン・並び順を一元管理します。カテゴリーアイコンはスポットのPINデザインには影響しません。</p></header>
    <SaveFeedback class="mt-6" :state="saveState" :message="message" />
    <details class="mt-6 border-y border-stone-200 py-4" :open="!data?.categories.length"><summary class="w-fit cursor-pointer text-sm font-semibold text-terracotta-700">＋ カテゴリーを追加</summary><form class="mt-4 space-y-4" @submit.prevent="createCategory">
      <div><label for="new-category-name" class="text-sm font-semibold text-stone-800">新しいカテゴリー名</label><input id="new-category-name" v-model="newName" maxlength="50" required class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5" placeholder="カテゴリー名"></div>
      <CategoryIconEditor v-model="newIcon" :map-id="mapId" />
      <div class="flex justify-end"><button :disabled="isSaving" class="rounded-lg bg-terracotta-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{{ isSaving ? '保存中…' : '追加' }}</button></div>
    </form></details>
    <div v-if="error" class="mt-6 rounded-lg bg-red-50 p-5 text-sm text-red-700">カテゴリーを読み込めませんでした。</div>
    <ul v-else class="mt-5 divide-y divide-stone-200">
      <li v-for="(category, index) in data?.categories" :key="category.id" class="py-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <span class="grid size-10 shrink-0 place-items-center rounded-lg bg-stone-100 text-stone-700"><CategoryIcon :icon-type="category.iconType" :icon-preset-id="category.iconPresetId" :icon-image-url="category.iconImageUrl" size="lg" /><span v-if="!category.iconType" aria-hidden="true" class="text-xs text-stone-400">なし</span></span>
            <div><strong>{{ category.name }}</strong><span class="ml-3 text-sm text-stone-500">{{ category.spotCount }}スポットで使用</span><NuxtLink v-if="category.spotCount" :to="{ path: `/admin/maps/${mapId}/spots`, query: { categoryId: category.id } }" class="ml-3 text-xs font-semibold text-terracotta-700">使用スポットを表示</NuxtLink></div>
          </div>
          <div class="flex gap-2">
            <button type="button" :disabled="isSaving || index === 0" class="rounded border px-3 py-1.5 disabled:opacity-30" aria-label="上へ移動" @click="moveCategory(index, -1)">↑</button>
            <button type="button" :disabled="isSaving || index === (data?.categories.length ?? 0) - 1" class="rounded border px-3 py-1.5 disabled:opacity-30" aria-label="下へ移動" @click="moveCategory(index, 1)">↓</button>
            <button type="button" class="rounded border px-3 py-1.5" @click="startEditing(category)">編集</button>
            <button type="button" :disabled="category.spotCount > 0" class="rounded border border-red-200 px-3 py-1.5 text-red-700 disabled:opacity-40" @click="deleteTarget = category">削除</button>
          </div>
        </div>
        <details class="mt-3"><summary class="w-fit cursor-pointer text-xs text-stone-500">英語名を編集</summary><label class="mt-3 block text-xs font-semibold text-stone-600">英語名（任意）<span class="mt-1 flex gap-2"><input v-model="category.englishName" class="w-full rounded border px-3 py-2 text-sm"><button type="button" class="rounded bg-stone-900 px-3 text-xs text-white" @click="saveEnglishName(category)">保存</button></span></label></details>
      </li>
    </ul>

    <AppDialog :open="editingId !== null" title="カテゴリー名を編集" description="カテゴリー名とアイコンを変更できます。" max-width="lg" @close="closeEditor">
      <form class="space-y-5" @submit.prevent="saveCategory" @keydown.enter="handleEditEnter">
        <div><label for="edit-category-name" class="text-sm font-semibold text-stone-800">カテゴリー名</label><input id="edit-category-name" v-model="editName" autofocus maxlength="50" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta-600"></div>
        <CategoryIconEditor v-model="editIcon" :map-id="mapId" />
        <p v-if="editError" role="alert" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ editError }}</p>
        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" :disabled="isSaving" class="rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold" @click="closeEditor">キャンセル</button><button :disabled="isSaving" class="rounded-lg bg-terracotta-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{{ isSaving ? '保存中…' : '保存' }}</button></div>
      </form>
    </AppDialog>

    <ConfirmDialog :open="deleteTarget !== null" title="カテゴリーを削除" :message="deleteTarget ? `「${deleteTarget.name}」を削除します。元に戻せません。` : ''" confirm-label="削除する" destructive :busy="isSaving" @cancel="deleteTarget = null" @confirm="deleteCategory" />
  </div>
</template>
