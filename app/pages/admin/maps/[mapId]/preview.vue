<script setup lang="ts">
import VisitorMapExperience from '~/components/map/VisitorMapExperience.vue'
import type { PublicMapResponse } from '~~/shared/types/public-map'
import { normalizeLocale } from '~~/shared/i18n/messages'
import { visitorPreviewReturnPath } from '~~/shared/utils/visitor-preview'

definePageMeta({ layout: false, middleware: 'auth' })
const route = useRoute()
const mapId = String(route.params.mapId)
const returnPath = computed(() => visitorPreviewReturnPath(mapId, route.query.from))
const requestedLocale = computed(() => normalizeLocale(route.query.lang))
const { data, error, status } = await useFetch<PublicMapResponse>(
  `/api/maps/${encodeURIComponent(mapId)}/visitor-preview`,
  { query: computed(() => requestedLocale.value === 'en' ? { lang: 'en' } : {}) },
)
if (error.value) throw createError({ statusCode: error.value.statusCode || 404, statusMessage: 'プレビューを表示できません。' })

useHead(() => ({
  title: `${data.value?.map.name ?? '来館者プレビュー'} | 編集中の内容`,
  meta: [{ name: 'robots', content: 'noindex, nofollow, noarchive' }],
}))
</script>

<template>
  <VisitorMapExperience :response="data" :status="status" :error="Boolean(error)" :analytics-enabled="false" />
  <aside aria-label="来館者プレビュー" data-preview-chrome class="fixed left-3 top-[calc(env(safe-area-inset-top)+4.25rem)] z-[100] flex max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-xl border border-amber-300 bg-amber-50/95 px-3 py-2 text-xs text-stone-900 shadow-lg backdrop-blur sm:left-1/2 sm:-translate-x-1/2 md:top-[4.25rem]">
    <div class="min-w-0"><strong class="block font-bold">来館者プレビュー</strong><span class="block truncate sm:hidden">編集中の内容</span><span class="hidden truncate sm:block">編集中の内容を表示しています</span></div>
    <NuxtLink :to="returnPath" class="shrink-0 rounded-lg bg-stone-900 px-3 py-2 font-semibold text-white hover:bg-stone-700">管理画面に戻る</NuxtLink>
  </aside>
</template>
