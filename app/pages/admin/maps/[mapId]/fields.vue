<script setup lang="ts">
import { customSpotFieldTypes } from '~~/shared/constants/spot-fields'
import type { SpotFieldDefinitionItem, SpotFieldDefinitionListResponse } from '~~/shared/types/spot-field'

definePageMeta({ layout: 'admin', middleware: 'auth' })
const route = useRoute()
const mapId = route.params.mapId as string
const { data, refresh } = await useFetch<SpotFieldDefinitionListResponse>(`/api/maps/${mapId}/spot-fields`)
const message = ref('')
const saveState = ref<'idle' | 'saving' | 'success' | 'error'>('idle')
const newField = reactive({ label: '', type: 'single_line_text', enabled: true, publicVisible: true, required: false, order: 100 })

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
    <header class="mt-5"><h1 class="text-3xl font-bold">Spot情報項目</h1><p class="mt-2 text-sm text-stone-600">名称は常に必須です。標準項目の意味は変えず、表示名・有効・公開・必須・順序を設定します。</p></header>
    <SaveFeedback class="mt-4" :state="saveState" :message="message" />
    <ol class="mt-6 space-y-3">
      <li v-for="field in data?.fields" :key="field.id" class="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-[1fr_auto]">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="text-xs font-semibold">表示名<input v-model="field.label" class="mt-1 w-full rounded border px-3 py-2 text-sm"></label>
          <label class="text-xs font-semibold">English label（任意）<span class="mt-1 flex gap-2"><input v-model="field.englishLabel" class="w-full rounded border px-3 py-2 text-sm"><button type="button" class="rounded bg-stone-700 px-2 text-white" @click="saveEnglishLabel(field)">保存</button></span></label>
          <label class="text-xs font-semibold">順序<input v-model.number="field.order" type="number" min="0" class="mt-1 w-full rounded border px-3 py-2 text-sm"></label>
          <label><input v-model="field.enabled" type="checkbox"> 有効</label>
          <label><input v-model="field.publicVisible" :disabled="!field.enabled" type="checkbox"> 公開</label>
          <label><input v-model="field.required" type="checkbox"> 必須</label>
          <span class="text-xs text-stone-500">{{ field.kind === 'standard' ? `標準: ${field.semanticKey}` : `カスタム: ${field.type}` }} / 値 {{ field.valueCount }}件</span>
        </div>
        <div class="flex items-center gap-2"><button type="button" :disabled="saveState === 'saving'" class="rounded bg-stone-900 px-3 py-2 text-sm text-white disabled:opacity-50" @click="save(field)">{{ saveState === 'saving' ? '保存中…' : '保存' }}</button><button v-if="field.kind === 'custom'" type="button" :disabled="field.valueCount > 0 || saveState === 'saving'" class="px-3 py-2 text-sm text-red-700 disabled:opacity-40" @click="remove(field)">{{ field.valueCount > 0 ? '値あり・無効化してください' : '削除' }}</button></div>
      </li>
    </ol>
    <form class="mt-6 rounded-xl border bg-white p-5" @submit.prevent="createCustomField">
      <h2 class="font-bold">カスタム項目を追加</h2>
      <div class="mt-3 flex flex-wrap gap-3"><input v-model="newField.label" required placeholder="項目名" class="rounded border px-3 py-2"><select v-model="newField.type" class="rounded border px-3 py-2"><option v-for="type in customSpotFieldTypes" :key="type" :value="type">{{ type }}</option></select><button :disabled="saveState === 'saving'" class="rounded bg-terracotta-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{{ saveState === 'saving' ? '追加中…' : '追加' }}</button></div>
    </form>
  </div>
</template>
