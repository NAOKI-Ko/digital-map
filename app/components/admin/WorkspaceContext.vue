<script setup lang="ts">
import type { AdminMapListResponse } from '~~/shared/types/map'
import { ADMIN_MAP_LIST_KEY } from '~/utils/admin-navigation'
const route = useRoute()
const { data: organizations } = await useFetch('/api/organizations')
const { data: maps } = await useFetch<AdminMapListResponse>('/api/maps', { key: ADMIN_MAP_LIST_KEY })
const workspace = computed(() => organizations.value?.organizations.find(item => item.id === organizations.value?.activeOrganizationId))
const map = computed(() => maps.value?.maps.find(item => item.id === route.params.mapId))
</script>
<template>
  <nav aria-label="現在の作業対象" class="mb-5 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 border-b border-stone-200 pb-3 text-sm text-stone-600">
    <NuxtLink to="/admin/workspaces" class="inline-flex min-h-11 min-w-0 items-center break-all">ワークスペース：{{ workspace?.name ?? '未選択' }}</NuxtLink>
    <NuxtLink to="/admin/dashboard" class="inline-flex min-h-11 min-w-0 items-center break-all">マップ：{{ map?.name ?? (route.params.mapId ? 'アクセスを確認してください' : '選択・作成') }} · 切替</NuxtLink>
  </nav>
</template>
