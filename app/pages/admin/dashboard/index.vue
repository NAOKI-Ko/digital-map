<script setup lang="ts">
import type { AdminMapListResponse } from '~~/shared/types/map'

definePageMeta({ layout: 'admin', middleware: 'auth' })
useHead({ title: 'マップ一覧 | デジタルマップ' })

const [{ data, error, refresh, status }, { data: organizationData }] = await Promise.all([
  useFetch<AdminMapListResponse>('/api/maps'),
  useFetch('/api/organizations'),
])
const maps = computed(() => data.value?.maps ?? [])
const canCreateMap = computed(() => data.value?.permissions.canCreateMap ?? false)
const activeOrganization = computed(() => organizationData.value?.organizations.find(item => item.id === organizationData.value?.activeOrganizationId))
const dateFormatter = new Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium', timeZone: 'Asia/Tokyo' })
function formatDate(value: string) { return dateFormatter.format(new Date(value)) }
</script>

<template>
  <div class="mx-auto max-w-7xl">
    <AdminPageHeader eyebrow="組織" :title="activeOrganization?.name ?? 'マップ一覧'" description="アクセスできるマップを選択してください。">
      <template v-if="canCreateMap" #actions>
        <NuxtLink to="/admin/maps/new" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-terracotta-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-terracotta-700"><span aria-hidden="true">＋</span>新しいマップ</NuxtLink>
      </template>
    </AdminPageHeader>

    <div class="mt-7 flex items-center justify-between gap-4 border-b border-stone-200 pb-3">
      <div><h2 class="text-base font-bold text-stone-950">マップ</h2><p class="mt-0.5 text-xs text-stone-500">{{ maps.length }}件</p></div>
    </div>

    <section v-if="status === 'pending'" class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-live="polite">
      <div v-for="index in 3" :key="index" class="h-44 animate-pulse rounded-xl bg-stone-200 motion-reduce:animate-none" />
    </section>

    <section v-else-if="error" class="mt-5 rounded-xl border border-red-200 bg-red-50 p-6">
      <h2 class="font-bold text-red-900">マップを読み込めませんでした</h2>
      <p class="mt-1 text-sm text-red-700">時間をおいて、もう一度お試しください。</p>
      <button type="button" class="mt-4 min-h-11 rounded-lg border border-red-300 bg-white px-4 text-sm font-semibold text-red-800 hover:bg-red-100" @click="refresh()">再読み込み</button>
    </section>

    <section v-else-if="maps.length === 0" class="mt-5 rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center">
      <div class="mx-auto grid size-11 place-items-center rounded-xl bg-terracotta-50 text-xl text-terracotta-700" aria-hidden="true">◇</div>
      <h2 class="mt-4 text-lg font-bold text-stone-950">{{ canCreateMap ? '最初のマップを作成しましょう' : '編集できるマップはありません' }}</h2>
      <p class="mx-auto mt-2 max-w-lg text-sm leading-6 text-stone-600">{{ canCreateMap ? 'マップ名を決めた後、フロア・イラストとSpotを順に登録できます。' : '組織オーナーからMap編集者に割り当てられると、ここに表示されます。' }}</p>
      <NuxtLink v-if="canCreateMap" to="/admin/maps/new" class="mt-5 inline-flex min-h-11 items-center rounded-lg bg-terracotta-600 px-4 text-sm font-semibold text-white hover:bg-terracotta-700">マップを作成</NuxtLink>
    </section>

    <section v-else class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <article v-for="map in maps" :key="map.id" class="group flex min-h-36 flex-col rounded-lg border border-stone-200 bg-white p-4 transition-[border-color,box-shadow] duration-150 hover:border-stone-300 hover:bg-stone-50 motion-reduce:transition-none">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0"><h2 class="truncate text-base font-bold text-stone-950">{{ map.name }}</h2><p class="mt-1 truncate text-xs text-stone-500">/{{ map.slug }}</p></div>
          <span class="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold" :class="map.isPublished ? 'text-emerald-800' : 'text-stone-500'"><span class="size-1.5 rounded-full" :class="map.isPublished ? 'bg-emerald-500' : 'bg-stone-400'" />{{ map.isPublished ? '公開中' : '下書き' }}</span>
        </div>
        <dl class="mt-3 flex gap-5 text-xs text-stone-500"><div><dt class="sr-only">フロア数</dt><dd>{{ map.floorCount }}フロア</dd></div><div><dt class="sr-only">最終更新</dt><dd>更新 {{ formatDate(map.updatedAt) }}</dd></div></dl>
        <NuxtLink :to="`/admin/maps/${map.id}`" class="mt-auto flex min-h-11 items-end justify-between pt-4 text-sm font-semibold text-terracotta-700"><span>マップを開く</span><span class="transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true">→</span></NuxtLink>
      </article>
    </section>
  </div>
</template>
