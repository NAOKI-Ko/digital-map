<script setup lang="ts">
import type { AdminMapListResponse } from '~~/shared/types/map'
import { ADMIN_MAP_LIST_KEY } from '~/utils/admin-navigation'

definePageMeta({ layout: 'admin', middleware: 'auth' })
useHead({ title: 'ワークスペース | デジタルマップ' })

const [{ data, error, refresh, status }, { data: organizationData }] = await Promise.all([
  useFetch<AdminMapListResponse>('/api/maps', { key: ADMIN_MAP_LIST_KEY }),
  useFetch('/api/organizations'),
])
const maps = computed(() => data.value?.maps ?? [])
const canCreateMap = computed(() => data.value?.permissions.canCreateMap ?? false)
const activeOrganization = computed(() => organizationData.value?.organizations.find(item => item.id === organizationData.value?.activeOrganizationId))
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <AdminPageHeader eyebrow="ワークスペース" :title="activeOrganization?.name ?? 'ホーム'" description="ワークスペースは所属先、マップは制作・公開する案内です。この所属先のマップを選びます。" />

    <section v-if="status === 'pending'" class="mt-7" aria-live="polite">
      <div class="h-48 animate-pulse rounded-xl bg-stone-200 motion-reduce:animate-none" />
    </section>

    <section v-else-if="error" class="mt-5 rounded-xl border border-red-200 bg-red-50 p-6">
      <h2 class="font-bold text-red-900">ワークスペースを読み込めませんでした</h2>
      <p class="mt-1 text-sm text-red-700">時間をおいて、もう一度お試しください。</p>
      <button type="button" class="mt-4 min-h-11 rounded-lg border border-red-300 bg-white px-4 text-sm font-semibold text-red-800 hover:bg-red-100" @click="refresh()">再読み込み</button>
    </section>

    <section v-else-if="maps.length === 0" class="mt-5 rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center">
      <div class="mx-auto grid size-11 place-items-center rounded-xl bg-terracotta-50 text-xl text-terracotta-700" aria-hidden="true">◇</div>
      <h2 class="mt-4 text-lg font-bold text-stone-950">{{ canCreateMap ? 'ワークスペースのマップを作成しましょう' : 'アクセスできるマップはありません' }}</h2>
      <p class="mx-auto mt-2 max-w-lg text-sm leading-6 text-stone-600">{{ canCreateMap ? 'まずマップ名と公開パスを設定してください。1つのワークスペースで複数のマップを管理できます。Plan Mockの操作は不要です。' : 'ワークスペースのオーナーに、マップまたは担当スポットへのアクセスを依頼してください。' }}</p>
      <NuxtLink v-if="canCreateMap" to="/admin/maps/new" class="mt-5 inline-flex min-h-11 items-center rounded-lg bg-terracotta-600 px-4 text-sm font-semibold text-white hover:bg-terracotta-700">マップを作成</NuxtLink>
    </section>

    <section v-else class="mt-7">
      <div class="mb-4 flex items-center justify-between gap-3"><h2 class="font-bold">マップを選ぶ</h2><NuxtLink v-if="canCreateMap" to="/admin/maps/new" class="inline-flex min-h-11 items-center rounded-lg bg-terracotta-600 px-4 text-sm font-semibold text-white">マップを作成</NuxtLink></div>
      <ul class="grid gap-4 sm:grid-cols-2"><li v-for="map in maps" :key="map.id"><NuxtLink :to="`/admin/maps/${map.id}`" class="block rounded-xl border border-stone-200 bg-white p-5 hover:border-terracotta-400"><h3 class="font-bold">{{ map.name }}</h3><p class="mt-2 text-sm text-stone-600">{{ map.isPublished ? '公開中' : '下書き' }} · {{ map.floorCount }}フロア</p></NuxtLink></li></ul>
    </section>
  </div>
</template>
