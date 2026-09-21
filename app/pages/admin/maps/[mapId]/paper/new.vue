<script setup lang="ts">
import type { PaperTemplateId } from '~~/shared/schemas/paper-map'
import type { PaperMapListResponse, PaperMapResponse } from '~~/shared/types/paper-map'
import { paperTemplateCatalog, templateSuitability } from '~~/shared/utils/paper-map-templates'

definePageMeta({ layout: 'admin', middleware: 'auth' })
const route = useRoute(), router = useRouter(), mapId = route.params.mapId as string
const { data } = await useFetch<PaperMapListResponse>(`/api/maps/${mapId}/paper-maps`)
const busy = ref<PaperTemplateId | null>(null), errorMessage = ref('')
const suitability = computed(() => templateSuitability({ spotCount: data.value?.source.spotCount ?? 0, photoCount: data.value?.source.photoCount ?? 0 }))
async function create(templateId: PaperTemplateId) {
  busy.value = templateId; errorMessage.value = ''
  try { const response = await $fetch<PaperMapResponse>(`/api/maps/${mapId}/paper-maps`, { method: 'POST', body: { templateId } }); await router.push(`/admin/maps/${mapId}/paper/${response.paperMap.id}`) }
  catch { errorMessage.value = '紙マップを作成できませんでした。公開できるスポットを確認してください。' }
  finally { busy.value = null }
}
</script>

<template>
  <div class="max-w-6xl"><NuxtLink :to="`/admin/maps/${mapId}/paper`" class="text-sm font-semibold text-stone-600">← 紙マップ一覧</NuxtLink>
    <header class="mt-6"><p class="text-sm font-medium text-terracotta-700">テンプレートから完成形へ</p><h1 class="mt-1 text-3xl font-bold">どんな紙マップにしますか？</h1><p class="mt-2 text-sm text-stone-600">レイアウトはデザイナーが調整済み。選ぶと既存のマップ情報がすぐに流し込まれます。</p></header>
    <div class="mt-8 grid gap-5 md:grid-cols-3">
      <button v-for="template in paperTemplateCatalog" :key="template.id" type="button" class="group min-h-80 overflow-hidden rounded-2xl border border-stone-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-terracotta-400 hover:shadow-lg disabled:opacity-60" :disabled="Boolean(busy)" @click="create(template.id)">
        <div class="relative h-40 bg-[#f5efe7] p-4"><div class="h-full rounded-sm bg-white p-3 shadow"><div class="h-2 w-1/2 rounded bg-stone-800"/><div class="mt-2 flex h-[calc(100%-1rem)] gap-2" :class="template.id === 'map-classic' ? 'flex-row' : 'flex-col'"><div class="rounded border border-terracotta-300 bg-[linear-gradient(135deg,#e8dfd0_25%,#f8f4ed_25%,#f8f4ed_50%,#e8dfd0_50%,#e8dfd0_75%,#f8f4ed_75%)] bg-[length:12px_12px]" :class="template.id === 'map-classic' ? 'w-2/3' : template.id === 'spot-guide' ? 'h-1/2' : 'h-2/5'"/><div class="flex-1 space-y-1"><span v-for="n in template.id === 'photo-story' ? 4 : 6" :key="n" class="block h-1.5 rounded bg-stone-200"/></div></div></div><span v-if="suitability.recommended === template.id" class="absolute right-3 top-3 rounded-full bg-terracotta-600 px-3 py-1 text-xs font-bold text-white">おすすめ</span></div>
        <div class="p-5"><h2 class="text-xl font-bold">{{ template.name }}</h2><p class="mt-2 text-sm leading-6 text-stone-600">{{ template.description }}</p><p v-if="suitability.recommended === template.id" class="mt-3 text-xs font-semibold text-terracotta-700">{{ suitability.reason }}</p><span class="mt-5 block text-sm font-bold text-terracotta-700">{{ busy === template.id ? '作成中…' : 'このテンプレートで作る →' }}</span></div>
      </button>
    </div><p v-if="errorMessage" role="alert" class="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">{{ errorMessage }}</p>
  </div>
</template>
