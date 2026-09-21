<script setup lang="ts">
import PaperMapPreview from '~/components/admin/PaperMapPreview.vue'
import UnsavedChangesGuard from '~/components/admin/UnsavedChangesGuard.vue'
import type { PaperMapConfig } from '~~/shared/schemas/paper-map'
import type { PaperMapResponse } from '~~/shared/types/paper-map'

definePageMeta({ layout: 'admin', middleware: 'auth' })
const route = useRoute()
const mapId = route.params.mapId as string
const paperMapId = route.params.paperMapId as string
const { data, status, error } = await useFetch<PaperMapResponse>(`/api/maps/${mapId}/paper-maps/${paperMapId}`)
const name = ref('')
const draft = ref<PaperMapConfig | null>(null)
const savedSnapshot = ref('')
const saving = ref(false), downloading = ref(false), errorMessage = ref('')
const advancedOpen = ref(false)
const { success } = useToast()
watch(data, (value) => {
  if (!value || draft.value) return
  name.value = value.paperMap.name
  draft.value = structuredClone(value.paperMap.config)
  savedSnapshot.value = JSON.stringify({ name: name.value, config: draft.value })
}, { immediate: true })
const dirty = computed(() => Boolean(draft.value && JSON.stringify({ name: name.value, config: draft.value }) !== savedSnapshot.value))
const categories = computed(() => {
  const values = data.value?.source.map.floors.flatMap(floor => floor.spots.flatMap(spot => spot.categories)) ?? []
  return [...new Map(values.map(item => [item.id, item])).values()].sort((a, b) => a.order - b.order)
})
const spots = computed(() => data.value?.source.map.floors.flatMap(floor => floor.spots) ?? [])
useHead(() => ({ title: `${name.value || '紙マップ編集'} | デジタルマップ` }))

function toggleId(list: string[], id: string, checked: boolean) { checked ? list.push(id) : list.splice(list.indexOf(id), 1) }
function changeOrder() { if (draft.value?.order === 'manual' && !draft.value.manualSpotIds.length) draft.value.manualSpotIds = spots.value.map(spot => spot.id) }
function moveManualSpot(index: number, direction: -1 | 1) {
  if (!draft.value) return
  const target = index + direction
  if (target < 0 || target >= draft.value.manualSpotIds.length) return
  const values = [...draft.value.manualSpotIds]
  ;[values[index], values[target]] = [values[target]!, values[index]!]
  draft.value.manualSpotIds = values
}
function resetDraft() {
  if (!data.value) return
  name.value = data.value.paperMap.name
  draft.value = structuredClone(data.value.paperMap.config)
}
function setViewport(mode: 'full' | 'fit_spots' | 'custom') { if (draft.value) draft.value.viewport = mode === 'custom' ? { mode, x: 0.1, y: 0.1, width: 0.8, height: 0.8 } : { mode } }
function changeViewport(event: Event) { setViewport((event.target as HTMLSelectElement).value as 'full' | 'fit_spots' | 'custom') }
function requestErrorMessage(error: unknown, fallback: string) {
  const data = typeof error === 'object' && error && 'data' in error ? (error as { data?: { statusMessage?: unknown } }).data : undefined
  return typeof data?.statusMessage === 'string' ? data.statusMessage : fallback
}

async function save() {
  if (!draft.value) return
  saving.value = true; errorMessage.value = ''
  try {
    const response = await $fetch<PaperMapResponse>(`/api/maps/${mapId}/paper-maps/${paperMapId}`, { method: 'PATCH', body: { name: name.value, config: draft.value } })
    data.value = response
    draft.value = structuredClone(response.paperMap.config)
    savedSnapshot.value = JSON.stringify({ name: response.paperMap.name, config: response.paperMap.config })
    success('紙マップを保存しました', 'paper-map')
  }
  catch (error: unknown) { errorMessage.value = requestErrorMessage(error, '保存できませんでした。設定を確認してください。') }
  finally { saving.value = false }
}

async function downloadPdf() {
  if (!draft.value) return
  downloading.value = true; errorMessage.value = ''
  try {
    const blob = await $fetch<Blob>(`/api/maps/${mapId}/paper-maps/${paperMapId}/pdf`, { method: 'POST', body: { config: draft.value }, responseType: 'blob' })
    const url = URL.createObjectURL(blob), anchor = document.createElement('a')
    anchor.href = url; anchor.download = `${name.value || 'paper-map'}.pdf`; anchor.click(); URL.revokeObjectURL(url)
    success('現在のプレビュー設定からPDFを作成しました', 'paper-map-pdf')
  }
  catch (error: unknown) { errorMessage.value = requestErrorMessage(error, 'PDFを作成できませんでした。') }
  finally { downloading.value = false }
}
</script>

<template>
  <div class="max-w-[1500px]">
    <NuxtLink :to="`/admin/maps/${mapId}/paper`" class="text-sm font-semibold text-stone-600">← 紙マップ一覧</NuxtLink>
    <section v-if="status === 'pending'" class="mt-6 rounded-xl bg-white p-8 text-sm text-stone-600">編集画面を準備しています…</section>
    <section v-else-if="error || !data || !draft" class="mt-6 rounded-xl bg-red-50 p-8 text-sm text-red-700">紙マップを読み込めませんでした。</section>
    <template v-else>
      <header class="mt-5 flex flex-wrap items-end justify-between gap-4"><div><p class="text-sm font-medium text-terracotta-700">Easy Builder</p><h1 class="mt-1 text-2xl font-bold">紙マップを仕上げる</h1><p class="mt-2 text-sm text-stone-600">右のプレビューを見ながら選ぶだけ。自由配置は不要です。</p></div><div class="flex flex-wrap gap-2"><button type="button" class="min-h-11 rounded-lg px-4 text-sm font-semibold text-stone-700 disabled:opacity-50" :disabled="!dirty || saving" @click="resetDraft">変更を戻す</button><button type="button" class="min-h-11 rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold" :disabled="downloading" @click="downloadPdf">{{ downloading ? 'PDF作成中…' : 'PDFをダウンロード' }}</button><button type="button" class="min-h-11 rounded-lg bg-terracotta-600 px-5 text-sm font-semibold text-white disabled:opacity-50" :disabled="saving || !dirty" @click="save">{{ saving ? '保存中…' : '保存' }}</button></div></header>
      <p v-if="errorMessage" role="alert" class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ errorMessage }}</p>
      <ul v-if="data.warnings.length" class="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><li v-for="warning in data.warnings" :key="warning">・{{ warning }}</li></ul>
      <div class="mt-6 grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <form class="space-y-5 rounded-2xl border border-stone-200 bg-white p-5" @submit.prevent="save">
          <label class="block text-sm font-semibold">管理用の名前<input v-model="name" maxlength="120" class="mt-2 min-h-11 w-full rounded-lg border border-stone-300 px-3 font-normal" /></label>
          <label class="block text-sm font-semibold">紙面タイトル<input v-model="draft.title" maxlength="120" class="mt-2 min-h-11 w-full rounded-lg border border-stone-300 px-3 font-normal" /></label>
          <label class="block text-sm font-semibold">ひとこと説明<input v-model="draft.subtitle" maxlength="240" placeholder="任意" class="mt-2 min-h-11 w-full rounded-lg border border-stone-300 px-3 font-normal" /></label>
          <fieldset><legend class="text-sm font-semibold">用紙</legend><div class="mt-2 grid grid-cols-2 gap-2"><label v-for="value in ['A4','A3']" :key="value" class="rounded-lg border p-3 text-sm"><input v-model="draft.paper" type="radio" :value="value" class="mr-2">{{ value }}</label></div></fieldset>
          <fieldset><legend class="text-sm font-semibold">向き</legend><div class="mt-2 grid grid-cols-2 gap-2"><label class="rounded-lg border p-3 text-sm"><input v-model="draft.orientation" type="radio" value="portrait" class="mr-2">縦</label><label class="rounded-lg border p-3 text-sm"><input v-model="draft.orientation" type="radio" value="landscape" class="mr-2">横</label></div></fieldset>
          <label class="block text-sm font-semibold">レイアウト<select v-model="draft.layout" class="mt-2 min-h-11 w-full rounded-lg border border-stone-300 px-3 font-normal"><option value="MAP_FOCUS">地図中心</option><option value="BALANCED">バランス</option><option value="GUIDE">案内中心</option></select></label>
          <label class="block text-sm font-semibold">地図の大きさ<select v-model="draft.mapSize" class="mt-2 min-h-11 w-full rounded-lg border border-stone-300 px-3 font-normal"><option value="large">大きく</option><option value="standard">標準</option><option value="info">案内を多く</option></select></label>
          <label class="block text-sm font-semibold">載せるスポット<select v-model="draft.selectionMode" class="mt-2 min-h-11 w-full rounded-lg border border-stone-300 px-3 font-normal"><option value="recommended">おすすめ（すべての公開スポット）</option><option value="categories">カテゴリーで選ぶ</option><option value="spots">スポットを選ぶ</option></select></label>
          <div v-if="draft.selectionMode === 'categories'" class="max-h-44 space-y-2 overflow-auto rounded-lg bg-stone-50 p-3"><label v-for="category in categories" :key="category.id" class="block text-sm"><input type="checkbox" :checked="draft.categoryIds.includes(category.id)" class="mr-2" @change="toggleId(draft.categoryIds, category.id, ($event.target as HTMLInputElement).checked)">{{ category.name }}</label></div>
          <div v-if="draft.selectionMode === 'spots'" class="max-h-52 space-y-2 overflow-auto rounded-lg bg-stone-50 p-3"><label v-for="spot in spots" :key="spot.id" class="block text-sm"><input type="checkbox" :checked="draft.spotIds.includes(spot.id)" class="mr-2" @change="toggleId(draft.spotIds, spot.id, ($event.target as HTMLInputElement).checked)">{{ spot.name }}</label></div>
          <button type="button" class="w-full rounded-lg border border-stone-300 px-4 py-3 text-left text-sm font-semibold" :aria-expanded="advancedOpen" @click="advancedOpen = !advancedOpen">{{ advancedOpen ? '−' : '+' }} もう少し調整する</button>
          <div v-if="advancedOpen" class="space-y-4 border-l-2 border-stone-200 pl-4">
            <label class="block text-sm font-semibold">情報量<select v-model="draft.density" class="mt-2 min-h-11 w-full rounded-lg border px-3 font-normal"><option value="names">名前だけ</option><option value="standard">標準</option><option value="detail">詳しく</option></select></label>
            <label class="block text-sm font-semibold">写真<select v-model="draft.photos" class="mt-2 min-h-11 w-full rounded-lg border px-3 font-normal"><option value="none">なし</option><option value="featured">主な写真</option><option value="all">できるだけ掲載</option></select></label>
            <label class="block text-sm font-semibold">並び順<select v-model="draft.order" class="mt-2 min-h-11 w-full rounded-lg border px-3 font-normal" @change="changeOrder"><option value="auto">おすすめ順</option><option value="name">名前順</option><option value="manual">手動順（保存順）</option></select></label>
            <ol v-if="draft.order === 'manual'" class="max-h-56 space-y-1 overflow-auto rounded-lg bg-stone-50 p-2"><li v-for="(spotId, index) in draft.manualSpotIds" :key="spotId" class="flex items-center gap-2 rounded bg-white px-2 py-1 text-xs"><span class="min-w-0 flex-1 truncate">{{ index + 1 }}. {{ spots.find(spot => spot.id === spotId)?.name ?? '削除されたスポット' }}</span><button type="button" :disabled="index === 0" aria-label="上へ移動" class="size-8 rounded border disabled:opacity-30" @click="moveManualSpot(index, -1)">↑</button><button type="button" :disabled="index === draft.manualSpotIds.length - 1" aria-label="下へ移動" class="size-8 rounded border disabled:opacity-30" @click="moveManualSpot(index, 1)">↓</button></li></ol>
            <label class="block text-sm font-semibold">配色<select v-model="draft.theme" class="mt-2 min-h-11 w-full rounded-lg border px-3 font-normal"><option value="brand">ブランド</option><option value="simple">シンプル</option><option value="warm">あたたかい</option><option value="natural">自然</option></select></label>
            <label class="block text-sm font-semibold">元データ<select v-model="draft.sourceMode" class="mt-2 min-h-11 w-full rounded-lg border px-3 font-normal"><option value="LIVE">現在の編集内容</option><option value="PUBLISHED">現在の公開版</option></select></label>
            <label class="block text-sm font-semibold">表示範囲<select :value="draft.viewport.mode" class="mt-2 min-h-11 w-full rounded-lg border px-3 font-normal" @change="changeViewport"><option value="fit_spots">スポットに合わせる</option><option value="full">全体</option><option value="custom">範囲を指定</option></select></label>
            <div v-if="draft.viewport.mode === 'custom'" class="grid grid-cols-2 gap-2 text-xs"><label>X<input v-model.number="draft.viewport.x" type="number" min="0" max="1" step="0.05" class="mt-1 w-full rounded border p-2"></label><label>Y<input v-model.number="draft.viewport.y" type="number" min="0" max="1" step="0.05" class="mt-1 w-full rounded border p-2"></label><label>幅<input v-model.number="draft.viewport.width" type="number" min="0.1" max="1" step="0.05" class="mt-1 w-full rounded border p-2"></label><label>高さ<input v-model.number="draft.viewport.height" type="number" min="0.1" max="1" step="0.05" class="mt-1 w-full rounded border p-2"></label></div>
            <label class="flex items-center gap-2 text-sm font-semibold"><input v-model="draft.qrEnabled" type="checkbox">WebマップのQRコードを載せる</label>
            <label v-if="draft.qrEnabled" class="block text-sm font-semibold">QRの案内文<input v-model="draft.qrLabel" maxlength="120" class="mt-2 min-h-11 w-full rounded-lg border px-3 font-normal"></label>
            <label class="flex items-center gap-2 text-sm font-semibold"><input v-model="draft.logoEnabled" type="checkbox">ロゴを載せる</label>
          </div>
          <NuxtLink :to="`/admin/maps/${mapId}/paper/request?paperMapId=${paperMapId}`" class="block rounded-lg bg-stone-100 px-4 py-3 text-center text-sm font-semibold text-stone-700">もっとこだわりたい方へ：デザイン制作を相談する</NuxtLink>
        </form>
        <div class="lg:sticky lg:top-4"><PaperMapPreview :config="draft" :source="data.source" /><p class="mt-2 text-center text-xs text-stone-500">プレビューは仕上がりの構成確認用です。PDFでは高解像度で出力します。</p></div>
      </div>
      <UnsavedChangesGuard :dirty="dirty && !saving" />
    </template>
  </div>
</template>
