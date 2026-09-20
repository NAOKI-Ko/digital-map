<script setup lang="ts">
import { analyticsSeries } from '~/utils/analytics-series'
definePageMeta({ layout: 'admin', middleware: 'auth' })
const route = useRoute()
const mapId = String(route.params.mapId)
const end = ref(new Date().toISOString().slice(0, 10))
const start = ref(new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10))
const { data, refresh, error, status } = await useFetch<{ timezone: string, displayTimezone: string, totalViews: number, daily: Array<{ date: string, viewCount: number }>, topSpots: Array<{ spotId: string, name: string, viewCount: number }> }>(`/api/maps/${mapId}/analytics`, { query: { start, end } })
const dailySeries = computed(() => analyticsSeries(start.value, end.value, data.value?.daily ?? []))
const peak = computed(() => Math.max(1, ...data.value?.daily.map(day => day.viewCount) ?? []))
const spotPeak = computed(() => Math.max(1, ...data.value?.topSpots.map(spot => spot.viewCount) ?? []))
useHead({ title: 'アクセス状況 | Digital Map' })
</script>

<template>
  <div class="max-w-6xl">
    <NuxtLink :to="`/admin/maps/${mapId}`" class="text-sm font-medium text-stone-600">← ホーム</NuxtLink>
    <AdminPageHeader class="mt-5" eyebrow="公開・運用" title="アクセス状況" description="公開マップとスポットの閲覧状況を確認できます。" />
    <form class="mt-6 flex flex-wrap items-end gap-3 border-y border-stone-200 py-4" @submit.prevent="refresh()">
      <label class="text-xs font-semibold text-stone-600">開始日<input v-model="start" type="date" required class="mt-1 block min-h-11 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"></label>
      <label class="text-xs font-semibold text-stone-600">終了日<input v-model="end" type="date" required class="mt-1 block min-h-11 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"></label>
      <button class="min-h-11 rounded-lg bg-stone-800 px-4 text-sm font-semibold text-white">更新</button>
      <p class="pb-3 text-xs text-stone-500">日別の集計基準：UTC</p>
    </form>
    <p v-if="error" role="alert" class="mt-4 text-sm text-red-700">アクセス状況を読み込めませんでした。日付範囲（最大367日）と通信状態を確認してください。</p>
    <p v-else-if="status === 'pending'" role="status" class="py-8 text-sm text-stone-500">集計を読み込んでいます…</p>
    <template v-else-if="data">
      <div class="flex items-baseline gap-4 border-b border-stone-200 py-5"><span class="text-sm text-stone-600">期間中のマップ閲覧数</span><strong class="text-3xl tracking-tight text-stone-900">{{ data.totalViews.toLocaleString('ja-JP') }}</strong><span class="text-xs text-stone-500">回</span></div>
      <div class="mt-7 grid items-start gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(16rem,1fr)]">
        <section class="min-w-0">
          <div class="flex items-center justify-between gap-3"><h2 class="text-base font-bold">日別の閲覧推移</h2><span v-if="data.daily.length" class="text-xs text-stone-500">最大 {{ peak }}回／日</span></div>
          <p class="mt-1 text-xs text-stone-500">選択期間の日別閲覧数です。記録のない日は0回として表示します。</p>
          <div v-if="data.daily.length" class="mt-5 overflow-x-auto border-b border-stone-200 bg-white px-4 pt-6">
            <div role="img" :aria-label="`日別閲覧数。最大${peak}回。詳しい数値は下の日別データで確認できます。`" class="flex h-48 items-end gap-1" :style="{ minWidth: `${Math.max(280, dailySeries.length * 12)}px` }">
              <div v-for="day in dailySeries" :key="day.date" class="group flex h-full min-w-0 flex-1 items-end justify-center" :title="`${day.date}：${day.viewCount}回`">
                <div class="w-full max-w-12 rounded-t-sm bg-terracotta-600" :style="{ height: `${day.viewCount / peak * 100}%` }" />
              </div>
            </div>
            <div class="flex justify-between gap-4 py-3 text-xs text-stone-500"><span>{{ dailySeries[0]?.date }}</span><span v-if="dailySeries.length > 1">{{ dailySeries.at(-1)?.date }}</span></div>
          </div>
          <p v-else class="mt-5 border-y border-dashed border-stone-300 py-16 text-center text-sm text-stone-500">この期間の閲覧はまだありません。</p>
          <details v-if="data.daily.length" class="mt-4"><summary class="w-fit cursor-pointer py-2 text-sm font-semibold text-stone-600">日別データを確認</summary><table class="mt-2 w-full text-sm"><caption class="sr-only">日別のマップ閲覧数（UTC）</caption><thead><tr class="border-b"><th scope="col" class="py-2 text-left">日付</th><th scope="col" class="py-2 text-right">閲覧数</th></tr></thead><tbody><tr v-for="day in dailySeries" :key="day.date" class="border-b border-stone-100"><td class="py-2">{{ day.date }}</td><td class="text-right tabular-nums">{{ day.viewCount }}</td></tr></tbody></table></details>
        </section>
        <section class="min-w-0"><h2 class="text-base font-bold">よく見られたスポット</h2><ol class="mt-4 divide-y divide-stone-200"><li v-for="(spot, index) in data.topSpots" :key="spot.spotId" class="py-3"><div class="flex items-start gap-3 text-sm"><span class="w-5 text-stone-400">{{ index + 1 }}</span><span class="min-w-0 flex-1 break-words font-medium">{{ spot.name }}</span><strong class="tabular-nums">{{ spot.viewCount.toLocaleString('ja-JP') }}</strong></div><div class="ml-8 mt-2 h-1 bg-stone-100"><div class="h-full bg-terracotta-300" :style="{ width: `${spot.viewCount / spotPeak * 100}%` }" /></div></li></ol><p v-if="!data.topSpots.length" class="py-8 text-sm text-stone-500">スポットの閲覧記録はまだありません。</p></section>
      </div>
      <p class="mt-8 border-t border-stone-200 pt-4 text-xs text-stone-500">広告識別子やIPアドレスは保存していません。</p>
    </template>
  </div>
</template>
