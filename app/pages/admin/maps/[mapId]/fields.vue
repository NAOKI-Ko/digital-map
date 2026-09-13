<script setup lang="ts">
import { customSpotFieldTypes } from '~~/shared/constants/spot-fields'
import type { SpotFieldDefinitionItem, SpotFieldDefinitionListResponse } from '~~/shared/types/spot-field'

definePageMeta({ layout: 'admin', middleware: 'auth' })
const route = useRoute()
const mapId = route.params.mapId as string
const { data, refresh } = await useFetch<SpotFieldDefinitionListResponse>(`/api/maps/${mapId}/spot-fields`)
const message = ref('')
const newField = reactive({ label: '', type: 'single_line_text', enabled: true, publicVisible: true, required: false, order: 100 })

async function save(field: SpotFieldDefinitionItem) {
  message.value = ''
  await $fetch(`/api/maps/${mapId}/spot-fields/${field.id}`, {
    method: 'PATCH',
    body: { label: field.label, enabled: field.enabled, publicVisible: field.enabled && field.publicVisible, required: field.required, order: field.order },
  })
  message.value = '項目設定を保存しました。'
  await refresh()
}

async function createCustomField() {
  await $fetch(`/api/maps/${mapId}/spot-fields`, { method: 'POST', body: newField })
  Object.assign(newField, { label: '', type: 'single_line_text', enabled: true, publicVisible: true, required: false, order: 100 })
  message.value = 'カスタム項目を追加しました。'
  await refresh()
}

async function remove(field: SpotFieldDefinitionItem) {
  if (field.kind !== 'custom' || field.valueCount > 0) return
  await $fetch(`/api/maps/${mapId}/spot-fields/${field.id}`, { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <div class="max-w-5xl">
    <NuxtLink :to="`/admin/maps/${mapId}/settings`" class="text-sm font-medium text-stone-600">← マップ設定に戻る</NuxtLink>
    <header class="mt-5"><h1 class="text-3xl font-bold">Spot情報項目</h1><p class="mt-2 text-sm text-stone-600">名称は常に必須です。標準項目の意味は変えず、表示名・有効・公開・必須・順序を設定します。</p></header>
    <p v-if="message" role="status" class="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{{ message }}</p>
    <ol class="mt-6 space-y-3">
      <li v-for="field in data?.fields" :key="field.id" class="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-[1fr_auto]">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="text-xs font-semibold">表示名<input v-model="field.label" class="mt-1 w-full rounded border px-3 py-2 text-sm"></label>
          <label class="text-xs font-semibold">順序<input v-model.number="field.order" type="number" min="0" class="mt-1 w-full rounded border px-3 py-2 text-sm"></label>
          <label><input v-model="field.enabled" type="checkbox"> 有効</label>
          <label><input v-model="field.publicVisible" :disabled="!field.enabled" type="checkbox"> 公開</label>
          <label><input v-model="field.required" type="checkbox"> 必須</label>
          <span class="text-xs text-stone-500">{{ field.kind === 'standard' ? `標準: ${field.semanticKey}` : `カスタム: ${field.type}` }} / 値 {{ field.valueCount }}件</span>
        </div>
        <div class="flex items-center gap-2"><button type="button" class="rounded bg-stone-900 px-3 py-2 text-sm text-white" @click="save(field)">保存</button><button v-if="field.kind === 'custom'" type="button" :disabled="field.valueCount > 0" class="px-3 py-2 text-sm text-red-700 disabled:opacity-40" @click="remove(field)">{{ field.valueCount > 0 ? '値あり・無効化してください' : '削除' }}</button></div>
      </li>
    </ol>
    <form class="mt-6 rounded-xl border bg-white p-5" @submit.prevent="createCustomField">
      <h2 class="font-bold">カスタム項目を追加</h2>
      <div class="mt-3 flex flex-wrap gap-3"><input v-model="newField.label" required placeholder="項目名" class="rounded border px-3 py-2"><select v-model="newField.type" class="rounded border px-3 py-2"><option v-for="type in customSpotFieldTypes" :key="type" :value="type">{{ type }}</option></select><button class="rounded bg-terracotta-600 px-4 py-2 font-semibold text-white">追加</button></div>
    </form>
  </div>
</template>
