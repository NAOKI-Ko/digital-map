<script setup lang="ts">
import type { AdminMapListResponse } from '~~/shared/types/map'

definePageMeta({ layout: 'admin', middleware: 'auth' })
useHead({ title: 'ワークスペース | デジタルマップ' })

const [{ data, error, refresh, status }, { data: organizationData }] = await Promise.all([
  useFetch<AdminMapListResponse>('/api/maps'),
  useFetch('/api/organizations'),
])
const maps = computed(() => data.value?.maps ?? [])
const canCreateMap = computed(() => data.value?.permissions.canCreateMap ?? false)
const activeOrganization = computed(() => organizationData.value?.organizations.find(item => item.id === organizationData.value?.activeOrganizationId))
if (maps.value.length === 1) {
  await navigateTo(`/admin/maps/${maps.value[0]!.id}`, { replace: true })
}
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <AdminPageHeader eyebrow="ワークスペース" :title="activeOrganization?.name ?? 'ホーム'" description="このワークスペースのDigital Mapを管理します。" />

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
      <p class="mx-auto mt-2 max-w-lg text-sm leading-6 text-stone-600">{{ canCreateMap ? '1つのマップで、イラスト表示と今後のリアル表示を管理します。まずマップ名と公開パスを設定してください。' : 'ワークスペースのオーナーに、マップまたは担当スポットへのアクセスを依頼してください。' }}</p>
      <NuxtLink v-if="canCreateMap" to="/admin/maps/new" class="mt-5 inline-flex min-h-11 items-center rounded-lg bg-terracotta-600 px-4 text-sm font-semibold text-white hover:bg-terracotta-700">マップを作成</NuxtLink>
    </section>

    <section v-else-if="maps.length > 1" class="mt-7 rounded-xl border border-amber-300 bg-amber-50 p-6" role="alert">
      <h2 class="font-bold text-amber-950">マップ構成を確認してください</h2>
      <p class="mt-2 text-sm leading-6 text-amber-900">このワークスペースに複数のアクセス可能なマップが返されました。WU-49の単一マップ契約と一致しないため、自動選択せず安全に停止しています。</p>
    </section>
  </div>
</template>
