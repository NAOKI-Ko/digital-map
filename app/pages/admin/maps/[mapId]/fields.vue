<script setup lang="ts">
import SaveFeedback from '~/components/ui/SaveFeedback.vue'
import { customSpotFieldTypes } from '~~/shared/constants/spot-fields'
import type { SpotFieldDefinitionItem, SpotFieldDefinitionListResponse } from '~~/shared/types/spot-field'

definePageMeta({ layout: 'admin', middleware: 'auth' })
const route = useRoute()
const mapId = route.params.mapId as string
const { data, refresh } = await useFetch<SpotFieldDefinitionListResponse>(`/api/maps/${mapId}/spot-fields`)
const message = ref('')
const saveState = ref<'idle' | 'saving' | 'success' | 'error'>('idle')
const newField = reactive({ label: '', type: 'single_line_text', enabled: true, publicVisible: true, required: false, order: 100 })
const fieldTypeLabels: Record<string, string> = {
  single_line_text: '一行テキスト',
  multiline_text: '複数行テキスト',
  number: '数値',
  url: 'URL',
  boolean: 'はい／いいえ',
}

function fieldTypeLabel(field: SpotFieldDefinitionItem) {
  return field.kind === 'standard' ? '標準項目' : (fieldTypeLabels[field.type] ?? field.type)
}

async function save(field: SpotFieldDefinitionItem) {
  message.value = ''
  saveState.value = 'saving'
  try {
    await $fetch(`/api/maps/${mapId}/spot-fields/${field.id}`, {
      method: 'PATCH',
      body: { label: field.label, enabled: field.enabled, publicVisible: field.enabled && field.publicVisible, required: field.required, order: field.order },
    })
    message.value = '項目設定を保存しました。'
    saveState.value = 'success'
    await refresh()
  }
  catch {
    message.value = '項目設定を保存できませんでした。入力内容を確認してください。'
    saveState.value = 'error'
  }
}

async function createCustomField() {
  message.value = ''
  saveState.value = 'saving'
  try {
    await $fetch(`/api/maps/${mapId}/spot-fields`, { method: 'POST', body: newField })
    Object.assign(newField, { label: '', type: 'single_line_text', enabled: true, publicVisible: true, required: false, order: 100 })
    message.value = 'カスタム項目を追加しました。'
    saveState.value = 'success'
    await refresh()
  }
  catch {
    message.value = 'カスタム項目を追加できませんでした。入力内容を確認してください。'
    saveState.value = 'error'
  }
}

async function remove(field: SpotFieldDefinitionItem) {
  if (field.kind !== 'custom' || field.valueCount > 0) return
  message.value = ''
  saveState.value = 'saving'
  try {
    await $fetch(`/api/maps/${mapId}/spot-fields/${field.id}`, { method: 'DELETE' })
    await refresh()
    message.value = 'カスタム項目を削除しました。'
    saveState.value = 'success'
  }
  catch {
    message.value = 'カスタム項目を削除できませんでした。'
    saveState.value = 'error'
  }
}

async function saveEnglishLabel(field: SpotFieldDefinitionItem) {
  saveState.value = 'saving'
  try {
    await $fetch(`/api/maps/${mapId}/spot-fields/${field.id}/translations`, { method: 'PATCH', body: { label: field.englishLabel || null } })
    message.value = '英語ラベルを保存しました。'
    saveState.value = 'success'
  }
  catch { message.value = '英語ラベルを保存できませんでした。'; saveState.value = 'error' }
}
</script>

<template>
  <div class="max-w-5xl">
    <AdminSubnavigation :map-id="mapId" area="map-edit" />
    <NuxtLink :to="`/admin/maps/${mapId}/settings`" class="text-sm font-medium text-stone-600">← マップ設定に戻る</NuxtLink>
    <header class="mt-5"><h1 class="text-3xl font-bold">スポット情報項目</h1></header>
    <SaveFeedback class="mt-4" :state="saveState" :message="message" />
    <ol class="mt-6 space-y-3">
      <li v-for="field in data?.fields" :key="field.id" class="border-b border-stone-200 bg-white px-4 py-5 first:border-t sm:px-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700">{{ fieldTypeLabel(field) }}</span>
            <span class="text-xs text-stone-500">値 {{ field.valueCount }}件</span>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button type="button" :disabled="saveState === 'saving'" class="rounded bg-stone-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50" @click="save(field)">{{ saveState === 'saving' ? '保存中…' : '保存' }}</button>
            <button v-if="field.kind === 'custom'" type="button" :disabled="field.valueCount > 0 || saveState === 'saving'" class="px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-40" @click="remove(field)">{{ field.valueCount > 0 ? '使用中' : '削除' }}</button>
          </div>
        </div>
        <div class="mt-4 grid gap-4 lg:grid-cols-[minmax(12rem,1.4fr)_minmax(12rem,1fr)_6rem]">
          <label class="text-xs font-semibold text-stone-700">表示名<input v-model="field.label" class="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm"></label>
          <label class="text-xs font-semibold text-stone-700">英語名（任意）<span class="mt-1 flex gap-2"><input v-model="field.englishLabel" class="min-w-0 flex-1 rounded border border-stone-300 px-3 py-2 text-sm"><button type="button" class="rounded border border-stone-300 px-3 text-sm font-semibold" @click="saveEnglishLabel(field)">保存</button></span></label>
          <label class="text-xs font-semibold text-stone-700">順序<input v-model.number="field.order" type="number" min="0" class="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm"></label>
        </div>
        <div class="mt-4 flex flex-wrap gap-x-6 gap-y-3 border-t border-stone-100 pt-4 text-sm">
          <label class="flex min-h-10 items-center gap-2"><input v-model="field.enabled" type="checkbox" class="size-4"> 有効</label>
          <label class="flex min-h-10 items-center gap-2" :class="!field.enabled ? 'text-stone-400' : ''"><input v-model="field.publicVisible" :disabled="!field.enabled" type="checkbox" class="size-4"> 公開</label>
          <label class="flex min-h-10 items-center gap-2"><input v-model="field.required" type="checkbox" class="size-4"> 必須</label>
        </div>
      </li>
    </ol>
    <form class="mt-8 border-y border-stone-200 bg-white py-5" @submit.prevent="createCustomField">
      <h2 class="font-bold">カスタム項目を追加</h2>
      <div class="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem_auto]"><input v-model="newField.label" aria-label="カスタム項目名" required placeholder="項目名" class="min-h-11 rounded border px-3 py-2"><select v-model="newField.type" aria-label="項目の種類" class="min-h-11 rounded border px-3 py-2"><option v-for="type in customSpotFieldTypes" :key="type" :value="type">{{ fieldTypeLabels[type] }}</option></select><button :disabled="saveState === 'saving'" class="min-h-11 rounded bg-terracotta-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{{ saveState === 'saving' ? '追加中…' : '追加' }}</button></div>
    </form>
  </div>
</template>
