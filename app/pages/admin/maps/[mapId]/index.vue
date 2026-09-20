<script setup lang="ts">
import type { MapHomeSummaryResponse } from '~~/shared/types/map-home'

definePageMeta({ layout: 'admin', middleware: 'auth' })
const route = useRoute()
const mapId = String(route.params.mapId)
const { data, error, refresh, status } = await useFetch<MapHomeSummaryResponse>(`/api/maps/${mapId}/home-summary`, { query: { days: 30 } })
const dateTimeFormatter = new Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tokyo' })

useHead(() => ({ title: `${data.value?.map.name ?? 'ホーム'} | Digital Map` }))

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value))
}
</script>

<template>
  <div class="mx-auto max-w-7xl">
    <section v-if="status === 'pending'" class="space-y-6" aria-live="polite">
      <div class="h-24 animate-pulse rounded-xl bg-stone-200 motion-reduce:animate-none" />
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4"><div v-for="index in 4" :key="index" class="h-28 animate-pulse rounded-xl bg-stone-200 motion-reduce:animate-none" /></div>
    </section>

    <section v-else-if="error || !data" class="rounded-xl border border-red-200 bg-red-50 p-6">
      <h1 class="text-lg font-bold text-red-900">ホームを読み込めませんでした</h1>
      <p class="mt-2 text-sm text-red-700">アクセス権または通信状態を確認してください。</p>
      <button type="button" class="mt-4 min-h-11 rounded-lg border border-red-300 bg-white px-4 text-sm font-semibold text-red-800 hover:bg-red-100" @click="refresh()">再読み込み</button>
    </section>

    <template v-else>
      <AdminPageHeader eyebrow="ホーム" :title="data.map.name">
        <template #actions>
          <NuxtLink :to="`/admin/maps/${mapId}/settings`" class="inline-flex min-h-11 items-center justify-center rounded-lg bg-terracotta-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-terracotta-700">マップを編集</NuxtLink>
          <a v-if="data.map.publicUrl" :href="data.map.publicUrl" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-11 items-center justify-center rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 hover:bg-stone-100">公開マップを見る<span class="ml-1" aria-hidden="true">↗</span></a>
        </template>
      </AdminPageHeader>

      <div class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <span class="inline-flex items-center gap-2 font-semibold" :class="data.map.isPublished ? 'text-emerald-800' : 'text-stone-600'"><span class="size-2 rounded-full" :class="data.map.isPublished ? 'bg-emerald-500' : 'bg-stone-400'" />{{ data.map.isPublished ? '公開中' : '下書き' }}</span>
        <span class="text-stone-300" aria-hidden="true">|</span>
        <span class="text-stone-500">{{ data.map.lastPublishedAt ? `最終公開 ${formatDateTime(data.map.lastPublishedAt)}` : 'まだ公開されていません' }}</span>
      </div>

      <section class="mt-6 grid grid-cols-2 divide-x divide-stone-200 border-y border-stone-200 py-2 lg:grid-cols-4" aria-label="マップの概要">
        <AdminMetricCard label="スポット" :value="data.metrics.spotCount" hint="登録済み" />
        <AdminMetricCard label="未配置" :value="data.metrics.unpositionedSpotCount" :hint="data.metrics.unpositionedSpotCount ? '位置設定が必要' : 'すべて配置済み'" :tone="data.metrics.unpositionedSpotCount ? 'warning' : 'neutral'" />
        <AdminMetricCard label="承認待ち" :value="data.metrics.pendingRevisionCount" :hint="data.metrics.pendingRevisionCount ? '確認が必要' : '確認待ちはありません'" :tone="data.metrics.pendingRevisionCount ? 'accent' : 'neutral'" />
        <AdminMetricCard :label="`${data.metrics.analyticsDays}日間の閲覧`" :value="data.metrics.recentMapViews.toLocaleString('ja-JP')" hint="マップの閲覧数" />
      </section>

      <div class="mt-8 grid gap-8 lg:grid-cols-2">
        <section class="min-w-0 border-t border-stone-200 pt-5">
          <div class="flex items-center justify-between gap-4"><div><h2 class="mt-1 text-lg font-bold text-stone-950">次にすること</h2></div></div>
          <ul v-if="data.nextActions.length" class="mt-4 divide-y divide-stone-100">
            <li v-for="action in data.nextActions" :key="action.kind">
              <NuxtLink :to="action.to" class="group flex min-h-16 items-center justify-between gap-4 py-3">
                <span><span class="block text-sm font-semibold text-stone-900 group-hover:text-terracotta-700">{{ action.label }}</span><span class="mt-0.5 block text-xs leading-5 text-stone-500">{{ action.description }}</span></span>
                <span class="text-stone-400 group-hover:translate-x-0.5 group-hover:text-terracotta-600 motion-reduce:transform-none" aria-hidden="true">→</span>
              </NuxtLink>
            </li>
          </ul>
          <div v-else class="mt-4 rounded-lg bg-emerald-50 px-4 py-5"><p class="text-sm font-semibold text-emerald-900">現在、対応が必要な項目はありません</p><p class="mt-1 text-xs text-emerald-800">マップの状態は整っています。</p></div>
        </section>

        <section class="min-w-0 border-t border-stone-200 pt-5">
          <div><h2 class="mt-1 text-lg font-bold text-stone-950">最近の重要な操作</h2></div>
          <ol v-if="data.recentActivity.length" class="mt-4 divide-y divide-stone-100">
            <li v-for="activity in data.recentActivity" :key="activity.id" class="flex min-h-16 items-center justify-between gap-4 py-3">
              <div><p class="text-sm font-semibold text-stone-900">{{ activity.label }}</p><p class="mt-0.5 text-xs text-stone-500">{{ activity.actorLabel }}</p></div>
              <time :datetime="activity.createdAt" class="shrink-0 text-xs text-stone-500">{{ formatDateTime(activity.createdAt) }}</time>
            </li>
          </ol>
          <p v-else class="mt-4 rounded-lg bg-stone-50 px-4 py-5 text-sm text-stone-600">表示できる最近の操作はありません。</p>
          <p class="mt-4 text-xs leading-5 text-stone-500">公開・承認などの重要な操作のみを表示しています。完全な履歴ではありません。</p>
        </section>
      </div>
    </template>
  </div>
</template>
