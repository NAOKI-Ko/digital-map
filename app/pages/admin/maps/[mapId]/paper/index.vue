<script setup lang="ts">
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue'
import type { PaperMapListResponse, PaperMapResponse, PaperMapSummary } from '~~/shared/types/paper-map'
import { paperTemplateCatalog, templateSuitability } from '~~/shared/utils/paper-map-templates'

definePageMeta({ layout: 'admin', middleware: 'auth' })
const route = useRoute()
const mapId = route.params.mapId as string
const { data, status, error, refresh } = await useFetch<PaperMapListResponse>(`/api/maps/${mapId}/paper-maps`)
const deleteTarget = ref<PaperMapSummary | null>(null)
const busy = ref(false)
const { success } = useToast()
useHead({ title: '紙マップ | デジタルマップ' })
const suitability = computed(() => templateSuitability({ spotCount: data.value?.source.spotCount ?? 0, photoCount: data.value?.source.photoCount ?? 0 }))
const recommendedTemplate = computed(() => paperTemplateCatalog.find(item => item.id === suitability.value.recommended)!)

async function quickCreate() {
  busy.value = true
  try {
    const response = await $fetch<PaperMapResponse>(`/api/maps/${mapId}/paper-maps`, { method: 'POST', body: { templateId: suitability.value.recommended } })
    await navigateTo(`/admin/maps/${mapId}/paper/${response.paperMap.id}`)
  }
  finally { busy.value = false }
}

async function removePaperMap() {
  if (!deleteTarget.value) return
  busy.value = true
  try {
    await $fetch(`/api/maps/${mapId}/paper-maps/${deleteTarget.value.id}`, { method: 'DELETE' })
    deleteTarget.value = null
    await refresh()
    success('紙マップを削除しました', 'paper-map')
  }
  finally { busy.value = false }
}

async function duplicatePaperMap(item: PaperMapSummary) {
  busy.value = true
  try {
    const response = await $fetch<PaperMapResponse>(`/api/maps/${mapId}/paper-maps/${item.id}/duplicate`, { method: 'POST' })
    await refresh()
    success('紙マップを複製しました', 'paper-map')
    await navigateTo(`/admin/maps/${mapId}/paper/${response.paperMap.id}`)
  }
  finally { busy.value = false }
}

async function downloadPdf(item: PaperMapSummary) {
  if (item.templateVersion === 2) { await navigateTo(`/admin/maps/${mapId}/paper/${item.id}`); return }
  busy.value = true
  try {
    const detail = await $fetch<PaperMapResponse>(`/api/maps/${mapId}/paper-maps/${item.id}`)
    const blob = await $fetch<Blob>(`/api/maps/${mapId}/paper-maps/${item.id}/pdf`, { method: 'POST', body: { config: detail.paperMap.config }, responseType: 'blob' })
    const url = URL.createObjectURL(blob), anchor = document.createElement('a')
    anchor.href = url; anchor.download = `${item.name}.pdf`; anchor.click(); URL.revokeObjectURL(url)
  }
  finally { busy.value = false }
}
</script>

<template>
  <div class="max-w-6xl">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div><p class="text-sm font-medium text-terracotta-700">紙で配る</p><h1 class="mt-1 text-3xl font-bold text-stone-900">紙マップ</h1><p class="mt-2 max-w-2xl text-sm leading-6 text-stone-600">デザイン済みテンプレートを選ぶと、既存マップ情報がすぐに流し込まれます。</p></div>
      <NuxtLink :to="`/admin/maps/${mapId}/paper/new`" class="inline-flex min-h-11 items-center rounded-lg bg-terracotta-600 px-5 text-sm font-semibold text-white hover:bg-terracotta-700">新しい紙マップを作る</NuxtLink>
    </header>
    <section class="mt-7 rounded-2xl border border-terracotta-200 bg-terracotta-50 p-5"><h2 class="font-bold text-stone-900">おすすめ：{{ recommendedTemplate.name }}</h2><p class="mt-1 text-sm text-stone-700">{{ suitability.reason }}</p><div class="mt-4 flex flex-wrap gap-3"><button type="button" class="min-h-11 rounded-lg bg-terracotta-600 px-5 text-sm font-bold text-white disabled:opacity-50" :disabled="busy || !data?.source.spotCount" @click="quickCreate">おすすめで紙マップを作る</button><NuxtLink :to="`/admin/maps/${mapId}/paper/new`" class="inline-flex min-h-11 items-center rounded-lg border border-stone-300 bg-white px-5 text-sm font-bold text-stone-800">テンプレートを選ぶ</NuxtLink></div></section>
    <section v-if="status === 'pending'" class="mt-7 rounded-xl bg-white p-8 text-sm text-stone-600">紙マップを読み込んでいます…</section>
    <section v-else-if="error" class="mt-7 rounded-xl bg-red-50 p-8 text-sm text-red-700">紙マップを読み込めませんでした。</section>
    <section v-else class="mt-8"><h2 class="text-lg font-bold">保存した紙マップ</h2>
      <div v-if="!data?.paperMaps.length" class="mt-4 rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-600">まだ紙マップはありません。テンプレートを選ぶとすぐにプレビューできます。</div>
      <ul v-else class="mt-4 grid gap-4 md:grid-cols-2"><li v-for="item in data.paperMaps" :key="item.id" class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"><div class="flex items-start justify-between gap-3"><div><h3 class="font-bold text-stone-900">{{ item.name }}</h3><p class="mt-1 text-xs text-stone-500">{{ item.paper }} · {{ item.orientation === 'portrait' ? '縦' : '横' }} · 更新 {{ new Date(item.updatedAt).toLocaleDateString('ja-JP') }}</p></div><span class="rounded-full bg-stone-100 px-2 py-1 text-xs text-stone-600">{{ item.templateId === 'map-classic' ? '地図を主役に' : item.templateId === 'spot-guide' ? 'スポットガイド' : '写真でめぐる' }}</span></div><div class="mt-5 flex flex-wrap gap-2"><NuxtLink :to="`/admin/maps/${mapId}/paper/${item.id}`" class="rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-semibold text-white">編集</NuxtLink><button type="button" class="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold disabled:opacity-50" :disabled="busy" @click="downloadPdf(item)">{{ item.templateVersion === 2 ? '確認してPDF' : 'PDF' }}</button><button type="button" class="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold disabled:opacity-50" :disabled="busy" @click="duplicatePaperMap(item)">複製</button><button type="button" class="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold" @click="deleteTarget = item">削除</button></div></li></ul>
    </section>
    <section class="mt-8 rounded-2xl border border-stone-200 bg-white p-6"><h2 class="text-lg font-bold">もっとデザインにこだわりたい方へ</h2><p class="mt-2 max-w-2xl text-sm leading-6 text-stone-600">写真を大きく使う、独自レイアウトにする、二つ折り・三つ折りにするなど、Easy Builderの範囲を超える制作は運営に相談できます。</p><NuxtLink :to="`/admin/maps/${mapId}/paper/request`" class="mt-4 inline-flex min-h-11 items-center rounded-lg border border-stone-300 px-4 text-sm font-semibold">デザイン制作を相談する</NuxtLink></section>
    <ConfirmDialog :open="deleteTarget !== null" title="紙マップを削除" :message="deleteTarget ? `「${deleteTarget.name}」を削除します。元に戻せません。` : ''" confirm-label="削除する" destructive :busy="busy" @cancel="deleteTarget = null" @confirm="removePaperMap" />
  </div>
</template>
