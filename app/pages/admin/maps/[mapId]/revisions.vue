<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
const route = useRoute()
const mapId = String(route.params.mapId)
const { data, error: loadError, refresh } = await useFetch(`/api/maps/${mapId}/revisions`)
const rejectTarget = ref<string | null>(null)
const rejectReason = ref('')
const operationError = ref('')
const processingId = ref<string | null>(null)

async function approve(id: string) {
  operationError.value = ''
  processingId.value = id
  try {
    await $fetch(`/api/maps/${mapId}/revisions/${id}/approve`, { method: 'POST' })
    await refresh()
  } catch (error: any) {
    operationError.value = error?.statusCode === 409 || error?.response?.status === 409
      ? '公開中のスポットが更新されたため承認できません。内容を確認して却下してください。'
      : '承認に失敗しました。時間をおいて再度お試しください。'
  } finally {
    processingId.value = null
  }
}

async function reject() {
  if (!rejectTarget.value || !rejectReason.value.trim()) return
  operationError.value = ''
  processingId.value = rejectTarget.value
  try {
    await $fetch(`/api/maps/${mapId}/revisions/${rejectTarget.value}/reject`, { method: 'POST', body: { reason: rejectReason.value } })
    rejectTarget.value = null
    rejectReason.value = ''
    await refresh()
  } catch {
    operationError.value = '却下に失敗しました。時間をおいて再度お試しください。'
  } finally {
    processingId.value = null
  }
}
</script>

<template>
  <section class="max-w-4xl">
    <AdminSubnavigation :map-id="mapId" area="spot" />
    <NuxtLink :to="`/admin/maps/${mapId}/spots`" class="text-sm underline">← スポット一覧へ</NuxtLink>
    <h1 class="mt-5 text-2xl font-bold">承認待ちの変更</h1>
    <p v-if="loadError" role="alert" class="mt-4 rounded bg-red-50 p-4 text-red-800">承認待ちの変更を読み込めませんでした。</p>
    <p v-if="operationError" role="alert" class="mt-4 rounded bg-red-50 p-4 text-red-800">{{ operationError }}</p>
    <div class="mt-6 space-y-4">
      <article v-for="revision in data?.revisions ?? []" :key="revision.id" class="rounded-xl bg-white p-6">
        <h2 class="font-bold">{{ revision.spot.name }}</h2>
        <p class="mt-1 text-sm text-stone-500">{{ revision.author.displayName || revision.author.email }} · base v{{ revision.baseVersion }} / live v{{ revision.spot.liveVersion }}</p>
        <pre class="mt-4 max-h-72 overflow-auto rounded bg-stone-100 p-3 text-xs">{{ JSON.stringify(revision.payload, null, 2) }}</pre>
        <div class="mt-4 flex gap-2">
          <button :disabled="processingId === revision.id" class="rounded bg-green-700 px-4 py-2 text-white disabled:opacity-50" @click="approve(revision.id)">承認</button>
          <button :disabled="processingId === revision.id" class="rounded border border-red-300 px-4 py-2 text-red-700 disabled:opacity-50" @click="rejectTarget = revision.id">却下</button>
        </div>
        <form v-if="rejectTarget === revision.id" class="mt-4 rounded border border-red-100 bg-red-50 p-4" @submit.prevent="reject">
          <label class="text-sm font-semibold">却下理由<textarea v-model="rejectReason" required maxlength="1000" class="mt-2 w-full rounded border px-3 py-2" /></label>
          <div class="mt-2 flex gap-2">
            <button class="rounded bg-red-700 px-3 py-2 text-white">却下を確定</button>
            <button type="button" class="px-3 py-2" @click="rejectTarget = null">キャンセル</button>
          </div>
        </form>
      </article>
      <p v-if="!(data?.revisions.length)" class="text-stone-600">承認待ちはありません。</p>
    </div>
  </section>
</template>
