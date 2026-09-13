<script setup lang="ts">
import type { MapFloorListResponse } from '~~/shared/types/floor'
import type { SpotCsvImportResponse, SpotCsvPreviewResponse } from '~~/shared/types/spot-csv'

definePageMeta({ layout: 'admin', middleware: 'auth' })
const route = useRoute()
const mapId = route.params.mapId as string
const { data } = await useFetch<MapFloorListResponse>(`/api/maps/${mapId}/floors`)
const floorId = ref('')
const csv = ref('')
const preview = ref<SpotCsvPreviewResponse['preview'] | null>(null)
const statusMessage = ref('')
const isWorking = ref(false)
const canImport = computed(() => preview.value !== null && preview.value.total > 0 && preview.value.errors === 0)

useHead({ title: 'Spot CSV一括登録 | デジタルマップ' })

async function readCsv(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  csv.value = file ? await file.text() : ''
  preview.value = null
  statusMessage.value = ''
}

async function previewCsv() {
  if (!floorId.value || !csv.value) return
  isWorking.value = true
  statusMessage.value = ''
  try {
    const response = await $fetch<SpotCsvPreviewResponse>(`/api/maps/${mapId}/spots/import/preview`, { method: 'POST', body: { floorId: floorId.value, csv: csv.value } })
    preview.value = response.preview
  }
  catch (error: any) { statusMessage.value = error?.data?.statusMessage ?? 'CSVを確認できませんでした。' }
  finally { isWorking.value = false }
}

async function importCsv() {
  if (!canImport.value) return
  isWorking.value = true
  try {
    const result = await $fetch<SpotCsvImportResponse>(`/api/maps/${mapId}/spots/import`, { method: 'POST', body: { floorId: floorId.value, csv: csv.value } })
    statusMessage.value = `${result.createdCount}件を未配置・非公開で登録しました。`
    preview.value = null
  }
  catch (error: any) { statusMessage.value = error?.data?.statusMessage ?? '一括登録できませんでした。変更は保存されていません。' }
  finally { isWorking.value = false }
}
</script>

<template>
  <div class="max-w-5xl">
    <NuxtLink :to="`/admin/maps/${mapId}/spots`" class="text-sm font-medium text-stone-600">← スポット一覧に戻る</NuxtLink>
    <header class="mt-5">
      <p class="text-sm font-medium text-terracotta-700">スポット管理</p>
      <h1 class="mt-1 text-3xl font-bold text-stone-900">CSV一括登録</h1>
      <p class="mt-2 text-sm text-stone-600">1つのフロアへ新規Spotだけを登録します。登録直後は全件が位置未設定・非公開です。</p>
    </header>
    <section class="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <a :href="`/api/maps/${mapId}/spots/import/template`" class="inline-flex rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold">現在の項目構成でテンプレートを取得</a>
      <div class="mt-6 grid gap-5 sm:grid-cols-2">
        <label class="text-sm font-semibold">対象フロア<select v-model="floorId" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5"><option value="">選択してください</option><option v-for="floor in data?.floors" :key="floor.id" :value="floor.id">{{ floor.name }}</option></select></label>
        <label class="text-sm font-semibold">CSVファイル<input type="file" accept=".csv,text/csv" class="mt-2 block w-full text-sm" @change="readCsv"></label>
      </div>
      <button type="button" :disabled="!floorId || !csv || isWorking" class="mt-6 rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40" @click="previewCsv">全行をプレビュー</button>
    </section>
    <section v-if="preview" class="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div class="flex flex-wrap gap-4 text-sm"><b>合計 {{ preview.total }}</b><span class="text-emerald-700">有効 {{ preview.valid }}</span><span class="text-amber-700">警告 {{ preview.warnings }}</span><span class="text-red-700">エラー {{ preview.errors }}</span></div>
      <ul class="mt-5 divide-y divide-stone-200 border-y border-stone-200">
        <li v-for="row in preview.rows" :key="row.rowNumber" class="py-3 text-sm"><b>{{ row.rowNumber }}行目: {{ row.name || '（名前なし）' }}</b><p v-for="message in row.messages" :key="`${message.level}-${message.message}`" class="mt-1" :class="message.level === 'error' ? 'text-red-700' : 'text-amber-700'">{{ message.level === 'error' ? 'エラー' : '警告' }}: {{ message.message }}</p></li>
      </ul>
      <button type="button" :disabled="!canImport || isWorking" class="mt-6 rounded-lg bg-terracotta-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40" @click="importCsv">{{ isWorking ? '登録中…' : 'エラーなしの全行を登録' }}</button>
      <p v-if="preview.errors" class="mt-2 text-sm text-red-700">エラーが1件でもあるため登録できません。</p>
    </section>
    <p v-if="statusMessage" role="status" class="mt-5 rounded-lg bg-stone-100 p-4 text-sm">{{ statusMessage }}</p>
  </div>
</template>
