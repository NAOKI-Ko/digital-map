<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
const route = useRoute()
const mapId = String(route.params.mapId)
const end = ref(new Date().toISOString().slice(0, 10))
const start = ref(new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10))
const { data, refresh, error } = await useFetch<{ timezone: string, displayTimezone: string, totalViews: number, daily: Array<{ date: string, viewCount: number }>, topSpots: Array<{ spotId: string, name: string, viewCount: number }> }>(`/api/maps/${mapId}/analytics`, { query: { start, end } })
useHead({ title: 'Analytics | デジタルマップ' })
</script>

<template>
  <div class="max-w-5xl">
    <NuxtLink :to="`/admin/maps/${mapId}/settings`" class="text-sm font-medium text-stone-600">← マップ設定に戻る</NuxtLink>
    <header class="mt-5"><h1 class="text-3xl font-bold">公開MAP Analytics</h1><p class="mt-2 text-sm text-stone-600">UTC日次集計を日本時間の運用画面で確認します。広告識別子やIPは保存しません。</p></header>
    <form class="mt-6 flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4" @submit.prevent="refresh()"><label class="text-xs font-semibold">開始<input v-model="start" type="date" class="mt-1 block rounded border px-3 py-2"></label><label class="text-xs font-semibold">終了<input v-model="end" type="date" class="mt-1 block rounded border px-3 py-2"></label><button class="rounded bg-stone-900 px-4 py-2 text-sm text-white">更新</button></form>
    <p v-if="error" class="mt-4 text-sm text-red-700">Analyticsを読み込めませんでした。</p>
    <template v-else-if="data">
      <section class="mt-6 rounded-xl border bg-white p-6"><p class="text-sm text-stone-500">Map views</p><p class="mt-1 text-4xl font-bold">{{ data.totalViews.toLocaleString() }}</p></section>
      <div class="mt-6 grid gap-6 md:grid-cols-2"><section class="rounded-xl border bg-white p-5"><h2 class="font-bold">日次Map views</h2><ul class="mt-3 divide-y"><li v-for="item in data.daily" :key="item.date" class="flex justify-between py-2 text-sm"><span>{{ item.date }}</span><strong>{{ item.viewCount }}</strong></li></ul></section><section class="rounded-xl border bg-white p-5"><h2 class="font-bold">Top Spots</h2><ol class="mt-3 divide-y"><li v-for="spot in data.topSpots" :key="spot.spotId" class="flex justify-between py-2 text-sm"><span>{{ spot.name }}</span><strong>{{ spot.viewCount }}</strong></li></ol></section></div>
    </template>
  </div>
</template>
