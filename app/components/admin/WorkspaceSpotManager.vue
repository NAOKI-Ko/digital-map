<script setup lang="ts">
import UnsavedChangesGuard from './UnsavedChangesGuard.vue'
const { data: inventory, refresh: refreshInventory } = await useFetch('/api/organization/spots')
const retained = computed(() => inventory.value?.spots.filter(spot => !spot.mapUsage || spot.mapUsage.map.archivedAt) ?? [])
const selected = ref('')
const endpoint = computed(() => `/api/organization/spots/${selected.value}`)
type RetainedContent = { spot: { id: string, contentVersion: number, name: string, description: string | null, address: string | null, website: string | null, phone: string | null, hoursText: string | null, holidayText: string | null }, customValues: Record<string, string | number | boolean | null>, fields: Array<{ id: string, kind: string, enabled: boolean, label: string, type: string }>, revisions: Array<{ id: string, payload: unknown }> }
const { data, refresh } = await useFetch<RetainedContent>(endpoint, { immediate: false, watch: false })
const busy = ref(false)
const message = ref('')
const form = reactive({ name: '', description: '', address: '', website: '', phone: '', hoursText: '', holidayText: '' })
const labels = { name: 'スポット名', description: '説明', address: '住所', website: 'Webサイト', phone: '電話番号', hoursText: '営業時間', holidayText: '定休日' }
const customValues = ref<Record<string, string | number | boolean | null>>({})
const baseline = ref('')
const dirty = computed(() => selected.value !== '' && JSON.stringify({ form, customValues: customValues.value }) !== baseline.value)
async function load(id: string) {
  selected.value = id
  await refresh()
  if (!data.value) return
  for (const key of Object.keys(form) as Array<keyof typeof form>) form[key] = data.value.spot[key] ?? ''
  customValues.value = data.value.customValues as typeof customValues.value
  baseline.value = JSON.stringify({ form, customValues: customValues.value })
}
async function save() {
  if (!data.value) return
  busy.value = true; message.value = ''
  try {
    await $fetch(endpoint.value, { method: 'PATCH', body: { ...Object.fromEntries(Object.entries(form).map(([key, value]) => [key, key === 'name' ? value : value || null])), customValues: Object.fromEntries(Object.entries(customValues.value).filter(([id]) => data.value!.fields.some(field => field.id === id && field.kind === 'custom' && field.enabled))), expectedContentVersion: data.value.spot.contentVersion } })
    await load(selected.value); await refreshInventory(); message.value = '保存しました。'
  }
  catch (e: any) { message.value = e?.data?.statusMessage ?? '保存できませんでした。' }
  finally { busy.value = false }
}
async function review(id: string, action: 'approve' | 'reject') {
  busy.value = true; message.value = ''
  try { await $fetch(`${endpoint.value}/revisions/${id}/${action}`, { method: 'POST', body: action === 'reject' ? { reason: 'ワークスペースのオーナーによる却下' } : {} }); await load(selected.value); message.value = action === 'approve' ? '承認しました。' : '却下しました。' }
  catch (e: any) { message.value = e?.data?.statusMessage ?? '更新できませんでした。' }
  finally { busy.value = false }
}
</script>
<template>
  <section v-if="retained.length" class="mt-6 border-t border-stone-200 pt-5">
    <h2 class="text-lg font-bold">マップから外したスポット</h2>
    <p class="mt-2 text-sm text-stone-600">マップから外した後も本文や項目、承認待ちの変更はワークスペースに残ります。オーナーが内容を管理できます。</p>
    <ul class="mt-3 flex flex-wrap gap-2"><li v-for="spot in retained" :key="spot.id"><button type="button" :disabled="busy || dirty" class="min-h-11 rounded border px-3 disabled:opacity-50" @click="load(spot.id)">{{ spot.name }}</button></li></ul>
    <form v-if="data && selected" class="mt-4 grid gap-3" @submit.prevent="save">
      <label v-for="(label, key) in labels" :key="key" class="text-sm font-semibold">{{ label }}<textarea v-if="key === 'description'" v-model="form[key]" class="dm-input mt-1 w-full" rows="4" /><input v-else v-model="form[key]" class="dm-input mt-1 w-full" :required="key === 'name'" :type="key === 'website' ? 'url' : 'text'"></label>
      <label v-for="field in data.fields.filter(item => item.kind === 'custom' && item.enabled)" :key="field.id" class="text-sm font-semibold">{{ field.label }}<input v-if="field.type === 'boolean'" v-model="customValues[field.id]" type="checkbox" class="ml-2"><input v-else-if="field.type === 'number'" v-model.number="customValues[field.id]" type="number" class="dm-input mt-1 w-full"><textarea v-else v-model="customValues[field.id] as string" class="dm-input mt-1 w-full" /></label>
      <button :disabled="busy || !dirty" class="min-h-11 justify-self-end rounded bg-terracotta-600 px-4 text-white disabled:opacity-50">保存</button>
    </form>
    <div v-for="revision in data?.revisions ?? []" :key="revision.id" class="mt-3 rounded border p-3">
      <p class="text-sm font-semibold">承認待ちの変更</p><pre class="mt-2 overflow-auto whitespace-pre-wrap text-xs">{{ revision.payload }}</pre>
      <button type="button" :disabled="busy || dirty" class="min-h-11 px-3 text-terracotta-700" @click="review(revision.id, 'approve')">承認する</button><button type="button" :disabled="busy || dirty" class="min-h-11 px-3 text-red-700" @click="review(revision.id, 'reject')">却下する</button>
    </div>
    <p v-if="message" role="status" class="mt-2 text-sm">{{ message }}</p>
    <UnsavedChangesGuard :dirty="dirty && !busy" />
  </section>
</template>
