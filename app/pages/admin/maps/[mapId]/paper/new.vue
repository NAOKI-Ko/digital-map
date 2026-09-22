<script setup lang="ts">
import PaperMapPreview, { type PaperPreviewResult } from '~/components/admin/PaperMapPreview.vue'
import type { PaperTemplateId } from '~~/shared/schemas/paper-map'
import type { PaperMapListResponse, PaperMapResponse } from '~~/shared/types/paper-map'
import { defaultPaperMapConfig, paperTemplateCatalog, templateSuitability } from '~~/shared/utils/paper-map-templates'
definePageMeta({ layout: 'admin', middleware: 'auth' })
useHead({ title: '紙マップを作る' })
const route = useRoute(), router = useRouter(), mapId = route.params.mapId as string
const { data, error } = await useFetch<PaperMapListResponse>(`/api/maps/${mapId}/paper-maps`)
const suitability = computed(() => templateSuitability({ spotCount: data.value?.source.spotCount ?? 0, photoCount: data.value?.source.photoCount ?? 0 }))
const chosen = ref<PaperTemplateId>(suitability.value.recommended), busy = ref(false), previewBusy = ref(true), preview = ref<PaperPreviewResult | null>(null), errorMessage = ref('')
const config = computed(() => defaultPaperMapConfig(chosen.value, data.value?.source.spotCount ?? 0, data.value?.source.map.name ?? ''))
async function create() {
  busy.value = true; errorMessage.value = ''
  try { const response = await $fetch<PaperMapResponse>(`/api/maps/${mapId}/paper-maps`, { method: 'POST', body: { templateId: chosen.value } }); await router.push(`/admin/maps/${mapId}/paper/${response.paperMap.id}`) }
  catch { errorMessage.value = '紙マップを作成できませんでした。公開できるスポットを確認してください。' }
  finally { busy.value = false }
}
</script>
<template>
  <div class="max-w-[1400px]">
    <NuxtLink :to="`/admin/maps/${mapId}/paper`" class="text-sm font-semibold text-stone-600">← 紙マップ一覧</NuxtLink>
    <header class="my-6"><p class="text-sm font-semibold text-terracotta-700">Digital Map から、そのまま紙へ</p><h1 class="mt-2 text-3xl font-bold">配りたい紙面を選ぶ</h1><p class="mt-3 text-sm text-stone-600">登録済みの情報で組版しました。文章や配置を作り直す必要はありません。</p></header>
    <p v-if="error" role="alert" class="rounded-lg bg-red-50 p-4">元のマップ情報を読み込めませんでした。ページを再読み込みしてください。</p>
    <div v-if="data" class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <PaperMapPreview :map-id="mapId" :config="config" :source="data.source" @resolved="preview = $event" @busy="previewBusy = $event" />
      <aside class="space-y-4 lg:sticky lg:top-5">
        <div class="rounded-xl border border-stone-200 bg-white p-4"><p class="text-xs font-semibold text-stone-500">元データ · 現在の編集内容</p><p class="mt-2 font-semibold">{{ data.source.map.name }}</p><p class="mt-1 text-sm text-stone-600">公開・配置済み {{ data.source.spotCount }}件 / 写真あり {{ data.source.photoCount }}件</p></div>
        <div class="space-y-2" role="group" aria-label="紙面の種類">
          <button v-for="template in paperTemplateCatalog" :key="template.id" type="button" class="w-full rounded-xl border p-4 text-left transition" :class="chosen === template.id ? 'border-terracotta-600 bg-terracotta-50' : 'border-stone-200 bg-white'" :aria-pressed="chosen === template.id" @click="chosen = template.id">
            <span class="font-bold">{{ template.name }}</span><span v-if="suitability.recommended === template.id" class="ml-2 text-xs font-semibold text-terracotta-700">おすすめ</span><span class="mt-1 block text-sm text-stone-600">{{ template.description }}</span>
          </button>
        </div>
        <p class="text-xs leading-5 text-stone-500">{{ suitability.reason }}。紙面用の文章や掲載範囲は、作成後に調整できます。</p>
        <ul v-if="preview?.warnings.length" class="space-y-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-900"><li v-for="warning in preview.warnings" :key="warning">{{ warning }}</li></ul>
        <button type="button" class="min-h-12 w-full rounded-xl bg-terracotta-600 px-5 py-3 font-bold text-white disabled:opacity-40" :disabled="busy || previewBusy || !preview?.image" @click="create">{{ busy ? '作成中…' : 'この紙面で作る' }}</button>
        <NuxtLink v-if="!data.source.spotCount" :to="`/admin/maps/${mapId}/spots`" class="block text-sm font-semibold text-terracotta-700">スポットの公開と位置を確認 →</NuxtLink>
        <p v-if="errorMessage" role="alert" class="text-sm text-red-700">{{ errorMessage }}</p>
      </aside>
    </div>
  </div>
</template>
