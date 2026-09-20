<script setup lang="ts">
import type { OrganizationSummary } from '~~/shared/types/organization'
import { workspaceRoleLabel, workspaceSelectionAction } from '~/utils/workspace-navigation'

definePageMeta({ layout: 'admin', middleware: 'auth' })
useHead({ title: 'ワークスペース | Digital Map' })

const { data, error, refresh, status } = await useFetch<{
  activeOrganizationId: string
  organizations: OrganizationSummary[]
}>('/api/organizations')
const switchingId = ref<string | null>(null)
const switchError = ref('')

async function selectWorkspace(workspace: OrganizationSummary) {
  if (switchingId.value) return
  switchError.value = ''
  if (workspaceSelectionAction(workspace.id, data.value?.activeOrganizationId) === 'navigate') {
    await navigateTo('/admin/dashboard')
    return
  }

  switchingId.value = workspace.id
  try {
    await $fetch('/api/organizations/active', {
      method: 'POST',
      body: { tenantId: workspace.id },
    })
    await reloadNuxtApp({ path: '/admin/dashboard', force: true })
  }
  catch {
    switchError.value = 'ワークスペースを切り替えられませんでした。時間をおいて、もう一度お試しください。'
    switchingId.value = null
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <AdminPageHeader eyebrow="現在の作業場所" title="ワークスペース" description="利用するワークスペースを選んでください。" />

    <div v-if="status === 'pending'" class="mt-7 space-y-3" aria-live="polite" aria-label="ワークスペースを読み込み中">
      <div class="h-24 animate-pulse rounded-xl bg-stone-200 motion-reduce:animate-none" />
      <div class="h-24 animate-pulse rounded-xl bg-stone-200 motion-reduce:animate-none" />
    </div>

    <section v-else-if="error" class="mt-7 rounded-xl border border-red-200 bg-red-50 p-6" role="alert">
      <h2 class="font-bold text-red-900">ワークスペースを読み込めませんでした</h2>
      <p class="mt-1 text-sm text-red-700">通信状態を確認して、もう一度お試しください。</p>
      <UiButton variant="secondary" class="mt-4" @click="refresh()">再読み込み</UiButton>
    </section>

    <section v-else class="mt-7" aria-label="利用できるワークスペース">
      <p v-if="switchError" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{{ switchError }}</p>
      <ul class="space-y-3">
        <li v-for="workspace in data?.organizations ?? []" :key="workspace.id">
          <button
            type="button"
            class="group flex min-h-[5.5rem] w-full items-center gap-4 rounded-xl border bg-white px-5 py-4 text-left shadow-sm transition hover:border-stone-400 hover:bg-stone-50 disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
            :class="workspace.id === data?.activeOrganizationId ? 'border-terracotta-300 ring-1 ring-inset ring-terracotta-100' : 'border-stone-200'"
            :aria-current="workspace.id === data?.activeOrganizationId ? 'true' : undefined"
            :aria-label="`${workspace.name}、${workspaceRoleLabel(workspace.role)}${workspace.id === data?.activeOrganizationId ? '、使用中' : 'に切り替える'}`"
            :disabled="Boolean(switchingId)"
            @click="selectWorkspace(workspace)"
          >
            <span class="min-w-0 flex-1">
              <span class="block truncate text-base font-bold text-stone-950">{{ workspace.name }}</span>
              <span class="mt-1 block text-sm text-stone-600">{{ workspaceRoleLabel(workspace.role) }}</span>
            </span>
            <span v-if="workspace.id === data?.activeOrganizationId" class="rounded-full bg-terracotta-50 px-3 py-1 text-xs font-bold text-terracotta-800">使用中</span>
            <span v-else-if="switchingId === workspace.id" class="text-sm font-semibold text-stone-600" aria-live="polite">切り替え中…</span>
            <AdminIcon v-else name="chevron" class="shrink-0 text-stone-500 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
