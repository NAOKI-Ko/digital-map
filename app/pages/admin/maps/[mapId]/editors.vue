<script setup lang="ts">
import SaveFeedback from '~/components/ui/SaveFeedback.vue'
import type { MapEditorsResponse } from '~~/shared/types/organization'
import type { AdminMapResponse } from '~~/shared/types/map'

definePageMeta({ layout: 'admin', middleware: 'auth' })
const route = useRoute()
const mapId = route.params.mapId as string
const { data: mapData } = await useFetch<AdminMapResponse>(`/api/maps/${mapId}`)
const { data, refresh, error } = await useFetch<MapEditorsResponse>(`/api/maps/${mapId}/editors`)
const selectedUserId = ref('')
const message = ref('')
const errorMessage = ref('')
const saving = ref(false)

async function addEditor() {
  if (!selectedUserId.value) return
  await run(async () => {
    await $fetch(`/api/maps/${mapId}/editors`, { method: 'POST', body: { userId: selectedUserId.value } })
    selectedUserId.value = ''
    await refresh()
    message.value = '編集者を追加しました。'
  })
}
async function removeEditor(userId: string) {
  await run(async () => {
    await $fetch(`/api/maps/${mapId}/editors/${userId}`, { method: 'DELETE' })
    await refresh()
    message.value = '編集者を解除しました。ワークスペースのメンバーとしては残ります。'
  })
}
async function run(action: () => Promise<void>) {
  saving.value = true; message.value = ''; errorMessage.value = ''
  try { await action() }
  catch (cause: any) { errorMessage.value = cause?.data?.statusMessage ?? '操作を完了できませんでした。' }
  finally { saving.value = false }
}
</script>

<template>
  <div class="max-w-4xl">
    <NuxtLink :to="`/admin/maps/${mapId}/settings`" class="text-sm font-medium text-stone-600">← マップ設定に戻る</NuxtLink>
    <header class="mt-5"><p class="text-sm font-medium text-terracotta-700">マップ設定</p><h1 class="mt-1 text-3xl font-bold">このマップの編集者</h1><p class="mt-2 text-sm text-stone-600">{{ mapData?.map.name }}。ワークスペースのオーナーはすべてのマップを編集できます。</p></header>
    <section v-if="error" class="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">この設定はワークスペースのオーナーだけが利用できます。</section>
    <section v-else class="mt-6 border-t border-stone-200 pt-5">
      <SaveFeedback :state="saving ? 'saving' : errorMessage ? 'error' : message ? 'success' : 'idle'" :message="errorMessage || message" />
      <form class="mt-5 flex gap-3" @submit.prevent="addEditor">
        <select aria-label="追加するワークスペースメンバー" v-model="selectedUserId" class="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2.5"><option value="">ワークスペースのメンバーを選択</option><option v-for="candidate in data?.candidates ?? []" :key="candidate.userId" :value="candidate.userId">{{ candidate.displayName || candidate.email }}</option></select>
        <button :disabled="saving || !selectedUserId" class="rounded-lg bg-terracotta-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">追加</button>
      </form>
      <div class="mt-6 divide-y divide-stone-200">
        <div v-for="editor in data?.editors ?? []" :key="editor.userId" class="flex items-center justify-between gap-4 py-4"><div><p class="font-semibold">{{ editor.displayName || editor.email }}</p><p v-if="editor.displayName" class="text-sm text-stone-500">{{ editor.email }}</p></div><button :disabled="saving" class="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700" @click="removeEditor(editor.userId)">解除</button></div>
        <p v-if="!(data?.editors.length)" class="py-6 text-center text-sm text-stone-500">割り当てられた編集者はいません。</p>
      </div>
    </section>
  </div>
</template>
