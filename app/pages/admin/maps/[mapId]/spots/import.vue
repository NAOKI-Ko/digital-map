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
const canImport = computed(() => preview.value !== null && preview.value.total > 0 && preview.value.errors === 0 && preview.value.conflicts === 0)
const exportUrl = computed(() => floorId.value ? `/api/maps/${mapId}/spots/import/export?floorId=${encodeURIComponent(floorId.value)}` : '')

useHead({ title: 'スポットCSV出力・一括編集 | デジタルマップ' })

watch(floorId, () => {
  preview.value = null
  statusMessage.value = ''
})

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
    statusMessage.value = `新規${result.createdCount}件、更新${result.updatedCount}件を保存しました（変更なし${result.unchangedCount}件）。`
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
      <h1 class="mt-1 text-3xl font-bold text-stone-900">CSV Export・一括編集</h1>
      <p class="mt-2 text-sm text-stone-600">1つのフロアの既存スポットをCSV出力して安全に一括編集できます。従来形式のCSVは新規登録専用として引き続き利用できます。</p>
    </header>
    <section class="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div class="flex flex-wrap gap-3">
        <a :href="`/api/maps/${mapId}/spots/import/template`" class="inline-flex rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold">テンプレートをダウンロード</a>
        <a :href="exportUrl || undefined" :aria-disabled="!floorId" :class="!floorId ? 'pointer-events-none opacity-40' : ''" class="inline-flex rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold">既存スポットをCSV出力</a>
      </div>
      <p class="mt-3 text-sm text-stone-600">出力CSVの <code>__</code> で始まる列は内部管理用です。編集・削除しないでください。CSVから行を削除してもスポットは削除されません。</p>
      <div class="mt-6 grid gap-5 sm:grid-cols-2">
        <label class="text-sm font-semibold">対象フロア<select v-model="floorId" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5"><option value="">選択してください</option><option v-for="floor in data?.floors" :key="floor.id" :value="floor.id">{{ floor.name }}</option></select></label>
        <label class="text-sm font-semibold">CSVファイル<input type="file" accept=".csv,text/csv" class="mt-2 block w-full text-sm" @change="readCsv"></label>
      </div>
      <button type="button" :disabled="!floorId || !csv || isWorking" class="mt-6 rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40" @click="previewCsv">全行をプレビュー</button>
    </section>
    <section v-if="preview" class="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div class="flex flex-wrap gap-4 text-sm"><b>合計 {{ preview.total }}</b><span class="text-sky-700">NEW {{ preview.newCount }}</span><span class="text-blue-700">UPDATE {{ preview.updateCount }}</span><span class="text-stone-600">UNCHANGED {{ preview.unchangedCount }}</span><span class="text-amber-700">WARNING {{ preview.warnings }}</span><span class="text-red-700">CONFLICT {{ preview.conflicts }}</span><span class="text-red-700">ERROR {{ preview.errors }}</span></div>
      <ul class="mt-5 divide-y divide-stone-200 border-y border-stone-200">
        <li v-for="row in preview.rows" :key="row.rowNumber" class="py-3 text-sm">
          <div class="flex flex-wrap items-center gap-2"><b>{{ row.rowNumber }}行目: {{ row.name || '（名前なし）' }}</b><span v-for="classification in row.classifications" :key="classification" class="rounded bg-stone-100 px-2 py-0.5 text-xs font-bold">{{ classification }}</span></div>
          <p v-for="message in row.messages" :key="`${message.level}-${message.message}`" class="mt-1" :class="message.level === 'warning' ? 'text-amber-700' : 'text-red-700'">{{ message.level === 'warning' ? '警告' : message.level === 'conflict' ? '競合' : 'エラー' }}: {{ message.message }}</p>
          <dl v-if="row.diffs.length" class="mt-2 grid gap-1 rounded-lg bg-stone-50 p-3">
            <div v-for="diff in row.diffs" :key="`${diff.field}-${diff.oldValue}-${diff.newValue}`" class="grid gap-1 sm:grid-cols-[12rem_1fr]">
              <dt class="font-medium">{{ diff.field }}</dt><dd class="break-words"><span class="text-red-700 line-through">{{ diff.oldValue }}</span> → <span class="text-emerald-700">{{ diff.newValue }}</span></dd>
            </div>
          </dl>
        </li>
      </ul>
      <button type="button" :disabled="!canImport || isWorking" class="mt-6 rounded-lg bg-terracotta-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40" @click="importCsv">{{ isWorking ? '保存中…' : 'プレビューどおり一括保存' }}</button>
      <p v-if="preview.errors" class="mt-2 text-sm text-red-700">ERRORが1件でもあるため保存できません。全行が0件更新になります。</p>
      <p v-if="preview.conflicts" class="mt-2 font-semibold text-red-700">競合があります。最新CSVを再Exportしてください。全行が0件更新になります。</p>
    </section>
    <p v-if="statusMessage" role="status" class="mt-5 rounded-lg bg-stone-100 p-4 text-sm">{{ statusMessage }}</p>
  </div>
</template>
