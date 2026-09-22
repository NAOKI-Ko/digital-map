<script setup lang="ts">
import PaperMapPreview, { type PaperPreviewResult } from '~/components/admin/PaperMapPreview.vue'
import PaperDesignPicker from '~/components/admin/PaperDesignPicker.vue'
import { paperDesignConfig, recommendPaperDesign, type PaperDesignId } from '~~/shared/utils/paper-map-designs'
import type { PaperMapListResponse, PaperMapResponse } from '~~/shared/types/paper-map'

definePageMeta({ layout: 'admin', middleware: 'auth' })
useHead({ title: '紙マップを作る' })
const route = useRoute(), router = useRouter(), mapId = route.params.mapId as string
const { data, error } = await useFetch<PaperMapListResponse>(`/api/maps/${mapId}/paper-maps`)
const suitability = computed(() => data.value ? recommendPaperDesign(data.value.source) : { id: 'neutral-guide' as PaperDesignId, reason: '' })
const chosen = ref<PaperDesignId>(suitability.value.id), busy = ref(false), previewBusy = ref(true), preview = ref<PaperPreviewResult | null>(null), errorMessage = ref('')
const config = computed(() => data.value ? paperDesignConfig(chosen.value, data.value.source) : null)
async function create() {
  busy.value = true; errorMessage.value = ''
  try { const response = await $fetch<PaperMapResponse>(`/api/maps/${mapId}/paper-maps`, { method: 'POST', body: { designId: chosen.value } }); await router.push(`/admin/maps/${mapId}/paper/${response.paperMap.id}`) }
  catch { errorMessage.value = '紙マップを作成できませんでした。公開できるスポットを確認してください。' }
  finally { busy.value = false }
}
</script>
<template>
  <div class="max-w-[1400px]">
    <NuxtLink :to="`/admin/maps/${mapId}/paper`" class="text-sm font-semibold text-stone-600">← 紙マップ一覧</NuxtLink>
    <header class="my-6"><p class="text-sm font-semibold text-terracotta-700">Digital Map から、そのまま紙へ</p><h1 class="mt-2 text-3xl font-bold">配りたい紙面を選ぶ</h1><p class="mt-3 text-sm text-stone-600">登録済みの情報で組版しました。文章や配置を作り直す必要はありません。</p></header>
    <p v-if="error" role="alert" class="rounded-lg bg-red-50 p-4">元のマップ情報を読み込めませんでした。ページを再読み込みしてください。</p>
    <div v-if="data && config" class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_27rem]">
      <PaperMapPreview :map-id="mapId" :config="config" :source="data.source" @resolved="preview = $event" @busy="previewBusy = $event" />
      <aside class="space-y-4 lg:sticky lg:top-5">
        <div class="rounded-xl border border-stone-200 bg-white p-4"><p class="text-xs font-semibold text-stone-500">元データ · 現在の編集内容</p><p class="mt-2 font-semibold">{{ data.source.map.name }}</p><p class="mt-1 text-sm text-stone-600">公開・配置済み {{ data.source.spotCount }}件 / 写真あり {{ data.source.photoCount }}件</p></div>
        <button type="button" class="min-h-12 w-full rounded-xl bg-terracotta-600 px-5 py-3 font-bold text-white disabled:opacity-40" :disabled="busy || previewBusy || !preview?.image" @click="create">{{ busy ? '作成中…' : 'この紙面で作る' }}</button>
        <PaperDesignPicker v-model="chosen" :map-id="mapId" :source="data.source" />
        <p class="text-xs leading-5 text-stone-500">{{ suitability.reason }}。紙面用の文章や掲載範囲は、作成後に調整できます。</p>
        <ul v-if="preview?.warnings.length" class="space-y-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-900"><li v-for="warning in preview.warnings" :key="warning">{{ warning }}</li></ul>

        <NuxtLink v-if="!data.source.spotCount" :to="`/admin/maps/${mapId}/spots`" class="block text-sm font-semibold text-terracotta-700">スポットの公開と位置を確認 →</NuxtLink>
        <p v-if="errorMessage" role="alert" class="text-sm text-red-700">{{ errorMessage }}</p>
      </aside>
    </div>
  </div>
</template>
