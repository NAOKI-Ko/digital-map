<script setup lang="ts">
import type { AdminSpotListResponse } from '~~/shared/types/spot'
import { journeyStatus } from '~~/shared/utils/journey-status'
import { visitorPreviewPath } from '~~/shared/utils/visitor-preview'

const props = defineProps<{ mapId: string }>()
const { data, error, status, refresh } = await useFetch<AdminSpotListResponse>(`/api/maps/${props.mapId}/spots`)
const progress = computed(() => journeyStatus(data.value?.spots ?? []))
</script>

<template>
  <section class="mt-6 rounded-xl border border-stone-200 bg-white p-5" aria-label="制作から公開まで">
    <h2 class="font-bold text-stone-950">制作から公開まで</h2>
    <p class="mt-2 text-sm leading-6 text-stone-600">保存は下書きの更新です。来館者プレビューで確認し、明示的に公開すると閲覧者へ反映されます。</p>
    <p v-if="status === 'pending'" role="status" class="mt-3 text-sm">保存済みの状態を確認しています…</p>
    <div v-else-if="error || !data" class="mt-3 text-sm" role="alert">状態を確認できませんでした。<button type="button" class="min-h-11 underline" @click="refresh()">再読み込み</button></div>
    <template v-else>
      <ol class="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <li><NuxtLink :to="`/admin/maps/${mapId}/floors`" class="inline-flex min-h-11 items-center font-semibold text-terracotta-700">1. 下地・フロア：{{ data.filters.floors.length }}件</NuxtLink></li>
        <li><NuxtLink :to="`/admin/maps/${mapId}/spots`" class="inline-flex min-h-11 items-center font-semibold text-terracotta-700">2. スポット：{{ progress.total }}件</NuxtLink><p class="text-stone-600">カテゴリー・写真・任意項目は必要なものだけ追加できます。</p></li>
        <li><NuxtLink :to="`/admin/maps/${mapId}/editor`" class="inline-flex min-h-11 items-center font-semibold text-terracotta-700">3. PIN配置：未配置 {{ progress.unplaced }}件</NuxtLink><p class="text-stone-600">未配置は掲載されません。配置済みで公開対象外：{{ progress.targetOff }}件。</p></li>
        <li><NuxtLink :to="visitorPreviewPath(mapId, 'home')" class="inline-flex min-h-11 items-center font-semibold text-terracotta-700">4. 来館者プレビュー：掲載候補 {{ progress.candidates }}件</NuxtLink><p class="text-stone-600">写真なし {{ progress.withoutPhoto }}件（写真は任意）。実際の見え方を確認してください。</p></li>
      </ol>
      <NuxtLink :to="`/admin/maps/${mapId}/publish`" class="mt-4 inline-flex min-h-11 items-center rounded-lg border border-stone-300 px-4 text-sm font-semibold">5. 公開・公開URL・QRを確認 →</NuxtLink>
      <p class="mt-3 text-xs leading-5 text-stone-600">位置合わせ・写真・任意情報・Plan Mockの操作は、Map作成や公開の必須条件ではありません。</p>
    </template>
  </section>
</template>
