<script setup lang="ts">
import type { AdminMapListResponse } from '~~/shared/types/map'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

useHead({ title: 'ダッシュボード | デジタルマップ' })

const { user } = useUserSession()
const { data, error, refresh, status } = await useFetch<AdminMapListResponse>('/api/maps')
const maps = computed(() => data.value?.maps ?? [])

const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  dateStyle: 'medium',
  timeZone: 'Asia/Tokyo',
})

function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}
</script>

<template>
  <div>
    <header class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-medium text-terracotta-700">
          ダッシュボード
        </p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          マップ一覧
        </h1>
        <p class="mt-2 text-sm text-stone-600">
          {{ user?.email }} の管理マップを表示しています。
        </p>
      </div>
      <NuxtLink
        to="/admin/maps/new"
        class="inline-flex items-center justify-center gap-2 rounded-lg bg-terracotta-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-terracotta-700 focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:ring-offset-2"
      >
        <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" d="M12 5v14M5 12h14" />
        </svg>
        新しいマップを作る
      </NuxtLink>
    </header>

    <section
      v-if="status === 'pending'"
      class="mt-8 rounded-2xl border border-stone-200 bg-white px-6 py-14 text-center shadow-sm"
      aria-live="polite"
    >
      <p class="text-sm text-stone-600">
        マップを読み込んでいます…
      </p>
    </section>

    <section
      v-else-if="error"
      class="mt-8 rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center"
    >
      <h2 class="font-bold text-red-900">
        マップを読み込めませんでした
      </h2>
      <p class="mt-2 text-sm text-red-700">
        時間をおいて、もう一度お試しください。
      </p>
      <button
        type="button"
        class="mt-5 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100"
        @click="refresh()"
      >
        再読み込み
      </button>
    </section>

    <section
      v-else-if="maps.length === 0"
      class="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center shadow-sm"
    >
      <div class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-terracotta-50 text-terracotta-700">
        <svg class="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
          <path stroke-linecap="round" d="M9 3v15M15 6v15" />
        </svg>
      </div>
      <h2 class="mt-5 text-lg font-bold text-stone-900">
        最初のマップを作りましょう
      </h2>
      <p class="mx-auto mt-2 max-w-lg text-sm leading-6 text-stone-600">
        マップ名を決めたら、イラスト画像やスポットを順番に登録できます。
      </p>
      <NuxtLink
        to="/admin/maps/new"
        class="mt-6 inline-flex rounded-lg bg-terracotta-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-terracotta-700"
      >
        マップを作成する
      </NuxtLink>
    </section>

    <section v-else class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="map in maps"
        :key="map.id"
        class="flex min-h-56 flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="truncate text-lg font-bold text-stone-900">
              {{ map.name }}
            </p>
            <p class="mt-1 truncate text-sm text-stone-500">
              /{{ map.slug }}
            </p>
          </div>
          <span
            class="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
            :class="map.isPublished
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-stone-100 text-stone-700'"
          >
            {{ map.isPublished ? '公開中' : '下書き' }}
          </span>
        </div>

        <dl class="mt-6 grid grid-cols-2 gap-4 border-t border-stone-100 pt-4 text-sm">
          <div>
            <dt class="text-stone-500">
              フロア
            </dt>
            <dd class="mt-1 font-semibold text-stone-900">
              {{ map.floorCount }}件
            </dd>
          </div>
          <div>
            <dt class="text-stone-500">
              最終更新
            </dt>
            <dd class="mt-1 font-semibold text-stone-900">
              {{ formatDate(map.updatedAt) }}
            </dd>
          </div>
        </dl>

        <NuxtLink
          :to="`/admin/maps/${map.id}/settings`"
          class="mt-auto pt-6 text-sm font-semibold text-terracotta-700 hover:text-terracotta-800"
        >
          マップを編集する →
        </NuxtLink>
      </article>
    </section>
  </div>
</template>
