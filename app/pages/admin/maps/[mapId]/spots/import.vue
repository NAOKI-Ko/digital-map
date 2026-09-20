<script setup lang="ts">
import type { SpotCsvImportResponse, SpotCsvPreviewResponse } from '~~/shared/types/spot-csv'

definePageMeta({ layout: 'admin', middleware: 'auth' })
const route = useRoute()
const mapId = route.params.mapId as string
const csv = ref('')
const preview = ref<SpotCsvPreviewResponse['preview'] | null>(null)
const statusMessage = ref('')
const isWorking = ref(false)
const canImport = computed(() => preview.value !== null && preview.value.total > 0 && preview.value.errors === 0 && preview.value.conflicts === 0)
const exportUrl = `/api/maps/${mapId}/spots/import/export`
const { success } = useToast()

useHead({ title: 'スポットをCSVでまとめて編集 | Digital Map' })

const classificationLabels: Record<string, string> = {
  NEW: '新規',
  UPDATE: '更新',
  UNCHANGED: '変更なし',
  WARNING: '警告',
  CONFLICT: '競合',
  ERROR: 'エラー',
}

function classificationLabel(classification: string) {
  return classificationLabels[classification] ?? classification
}

async function readCsv(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  csv.value = file ? await file.text() : ''
  preview.value = null
  statusMessage.value = ''
}

async function previewCsv() {
  if (!csv.value) return
  isWorking.value = true
  statusMessage.value = ''
  try {
    const response = await $fetch<SpotCsvPreviewResponse>(`/api/maps/${mapId}/spots/import/preview`, { method: 'POST', body: { csv: csv.value } })
    preview.value = response.preview
  }
  catch (error: any) { statusMessage.value = error?.data?.statusMessage ?? 'CSVを確認できませんでした。' }
  finally { isWorking.value = false }
}

async function importCsv() {
  if (!canImport.value) return
  isWorking.value = true
  try {
    const result = await $fetch<SpotCsvImportResponse>(`/api/maps/${mapId}/spots/import`, { method: 'POST', body: { csv: csv.value } })
    success(`CSVを取り込みました（新規${result.createdCount}件・更新${result.updatedCount}件）`, 'spot-csv-import')
    statusMessage.value = ''
    preview.value = null
  }
  catch (error: any) { statusMessage.value = error?.data?.statusMessage ?? '一括登録できませんでした。変更は保存されていません。' }
  finally { isWorking.value = false }
}
</script>

<template>
  <div class="max-w-5xl">
    <AdminSubnavigation :map-id="mapId" area="spot" />
    <NuxtLink :to="`/admin/maps/${mapId}/spots`" class="text-sm font-medium text-stone-600">← スポット一覧に戻る</NuxtLink>
    <header class="mt-5">
      <p class="text-sm font-medium text-terracotta-700">スポット管理</p>
      <h1 class="mt-1 text-3xl font-bold text-stone-900">スポットCSV</h1>
      <p class="mt-2 text-sm text-stone-600">マップ内の全フロアのスポットを書き出し、表計算ソフトで編集して安全に取り込めます。</p>
    </header>
    <section class="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 class="text-lg font-bold">CSVを書き出す</h2>
      <p class="mt-2 text-sm text-stone-600">現在のマップにある全フロアのスポットを書き出します。ExcelやGoogle Sheetsなどで編集できます。</p>
      <a :href="exportUrl" class="mt-4 inline-flex min-h-11 items-center rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold">CSVを書き出す</a>
      <p class="mt-3 text-sm text-stone-600"><code>__</code>から始まる列はシステム管理用です。編集・削除しないでください。</p>
    </section>
    <section class="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 class="text-lg font-bold">CSVを取り込む</h2>
      <p class="mt-2 text-sm text-stone-600">編集したCSVを選び、保存前に変更内容を確認します。CSVから行を削除してもスポットは削除されません。</p>
      <label class="mt-5 block text-sm font-semibold">CSVファイル<input type="file" accept=".csv,text/csv" class="mt-2 block w-full text-sm" @change="readCsv"></label>
      <button type="button" :disabled="!csv || isWorking" class="mt-6 rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40" @click="previewCsv">{{ isWorking ? '確認中…' : '内容を確認' }}</button>
    </section>
    <section v-if="preview" class="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div class="flex flex-wrap gap-4 text-sm"><b>合計 {{ preview.total }}</b><span class="text-sky-700">新規 {{ preview.newCount }}</span><span class="text-blue-700">更新 {{ preview.updateCount }}</span><span class="text-stone-600">変更なし {{ preview.unchangedCount }}</span><span class="text-amber-700">警告 {{ preview.warnings }}</span><span class="text-red-700">競合 {{ preview.conflicts }}</span><span class="text-red-700">エラー {{ preview.errors }}</span></div>
      <ul class="mt-5 divide-y divide-stone-200 border-y border-stone-200">
        <li v-for="row in preview.rows" :key="row.rowNumber" class="py-3 text-sm">
          <div class="flex flex-wrap items-center gap-2"><b>{{ row.rowNumber }}行目: {{ row.name || '（名前なし）' }}</b><span v-if="row.floorName" class="text-stone-500">{{ row.floorName }}</span><span v-for="classification in row.classifications" :key="classification" class="rounded bg-stone-100 px-2 py-0.5 text-xs font-bold">{{ classificationLabel(classification) }}</span></div>
          <p v-for="message in row.messages" :key="`${message.level}-${message.message}`" class="mt-1" :class="message.level === 'warning' ? 'text-amber-700' : 'text-red-700'">{{ message.level === 'warning' ? '警告' : message.level === 'conflict' ? '競合' : 'エラー' }}: {{ message.message }}</p>
          <dl v-if="row.diffs.length" class="mt-2 grid gap-1 rounded-lg bg-stone-50 p-3">
            <div v-for="diff in row.diffs" :key="`${diff.field}-${diff.oldValue}-${diff.newValue}`" class="grid gap-1 sm:grid-cols-[12rem_1fr]">
              <dt class="font-medium">{{ diff.field }}</dt><dd class="break-words"><span class="text-red-700 line-through">{{ diff.oldValue }}</span> → <span class="text-emerald-700">{{ diff.newValue }}</span></dd>
            </div>
          </dl>
        </li>
      </ul>
      <button type="button" :disabled="!canImport || isWorking" class="mt-6 rounded-lg bg-terracotta-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40" @click="importCsv">{{ isWorking ? '取り込み中…' : 'この内容で取り込む' }}</button>
      <p v-if="preview.errors" class="mt-2 text-sm text-red-700">エラーが1件でもあるため保存できません。全行が0件更新になります。</p>
      <p v-if="preview.conflicts" class="mt-2 font-semibold text-red-700">競合があります。最新のCSVを書き出し直してください。全行が0件更新になります。</p>
    </section>
    <p v-if="statusMessage" role="status" class="mt-5 rounded-lg bg-stone-100 p-4 text-sm">{{ statusMessage }}</p>
  </div>
</template>
