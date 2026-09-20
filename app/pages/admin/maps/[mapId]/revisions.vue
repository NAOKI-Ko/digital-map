<script setup lang="ts">
import UiDialog from '~/components/ui/UiDialog.vue'

interface ReviewRevision {
  id: string
  baseVersion: number
  createdAt: string
  author: { displayName: string | null, email: string }
  spot: { id: string, name: string, liveVersion: number }
  review: {
    valid: boolean
    stale: boolean
    changes: Array<{ key: string, label: string, current: string, requested: string }>
    photos: null | { current: Array<{ id: string, url: string }>, requested: Array<{ id: string, url: string }> }
  }
}

definePageMeta({ layout: 'admin', middleware: 'auth' })
const route = useRoute()
const mapId = String(route.params.mapId)
const { data, error: loadError, refresh } = await useFetch<{ revisions: ReviewRevision[] }>(`/api/maps/${mapId}/revisions`)
const rejectTarget = ref<ReviewRevision | null>(null)
const rejectReason = ref('')
const operationError = ref('')
const processingId = ref<string | null>(null)
const { success } = useToast()

function submittedAt(value: string) {
  return new Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

async function approve(revision: ReviewRevision) {
  if (revision.review.stale || !revision.review.valid) return
  operationError.value = ''
  processingId.value = revision.id
  try {
    await $fetch(`/api/maps/${mapId}/revisions/${revision.id}/approve`, { method: 'POST' })
    await refresh()
    success('変更申請を承認しました', 'revision-operation')
  } catch (error: any) {
    operationError.value = error?.statusCode === 409 || error?.response?.status === 409
      ? '公開中のスポットが更新されたため承認できません。内容を確認して却下してください。'
      : '承認に失敗しました。時間をおいて再度お試しください。'
  } finally {
    processingId.value = null
  }
}

function openReject(revision: ReviewRevision) {
  operationError.value = ''
  rejectReason.value = ''
  rejectTarget.value = revision
}

async function reject() {
  if (!rejectTarget.value || !rejectReason.value.trim()) return
  operationError.value = ''
  processingId.value = rejectTarget.value.id
  try {
    await $fetch(`/api/maps/${mapId}/revisions/${rejectTarget.value.id}/reject`, { method: 'POST', body: { reason: rejectReason.value } })
    rejectTarget.value = null
    rejectReason.value = ''
    await refresh()
    success('変更申請を却下しました', 'revision-operation')
  } catch {
    operationError.value = '却下に失敗しました。入力した理由は保持されています。時間をおいて再度お試しください。'
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
      <article v-for="revision in data?.revisions ?? []" :key="revision.id" class="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-bold">{{ revision.spot.name }}</h2>
        <p class="mt-1 text-sm text-stone-600">{{ revision.author.displayName || revision.author.email }}さんからの変更申請</p>
        <time :datetime="revision.createdAt" class="mt-1 block text-sm text-stone-500">{{ submittedAt(revision.createdAt) }}</time>

        <div v-if="revision.review.stale" role="alert" class="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <b>この申請後にスポットが更新されています。</b>
          <p class="mt-1">現在の内容と申請内容が一致しないため承認できません。内容を確認して却下してください。</p>
        </div>
        <p v-if="!revision.review.valid" role="alert" class="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">申請データを安全に表示できないため承認できません。却下してください。</p>

        <section class="mt-5" aria-label="変更内容">
          <h3 class="font-bold">変更内容</h3>
          <dl v-if="revision.review.changes.length" class="mt-3 divide-y divide-stone-200 border-y border-stone-200">
            <div v-for="change in revision.review.changes" :key="change.key" class="grid gap-2 py-4 sm:grid-cols-[10rem_1fr]">
              <dt class="font-semibold text-stone-900">{{ change.label }}</dt>
              <dd class="grid gap-2 text-sm sm:grid-cols-2">
                <div><span class="block text-xs font-semibold text-stone-500">現在</span><span class="mt-1 block whitespace-pre-wrap break-words">{{ change.current }}</span></div>
                <div><span class="block text-xs font-semibold text-terracotta-700">変更後</span><span class="mt-1 block whitespace-pre-wrap break-words">{{ change.requested }}</span></div>
              </dd>
            </div>
          </dl>
          <div v-if="revision.review.photos" class="border-b border-stone-200 py-4">
            <h4 class="font-semibold">写真</h4>
            <div class="mt-3 grid gap-4 sm:grid-cols-2">
              <div><span class="text-xs font-semibold text-stone-500">現在</span><div class="mt-2 flex flex-wrap gap-2"><img v-for="photo in revision.review.photos.current" :key="photo.id" :src="photo.url" alt="現在の写真" class="size-24 rounded-lg object-cover"><span v-if="!revision.review.photos.current.length" class="text-sm text-stone-500">未設定</span></div></div>
              <div><span class="text-xs font-semibold text-terracotta-700">変更後</span><div class="mt-2 flex flex-wrap gap-2"><img v-for="photo in revision.review.photos.requested" :key="photo.id" :src="photo.url" alt="変更後の写真" class="size-24 rounded-lg object-cover"><span v-if="!revision.review.photos.requested.length" class="text-sm text-stone-500">未設定</span></div></div>
            </div>
          </div>
          <p v-if="!revision.review.changes.length && !revision.review.photos" class="mt-3 text-sm text-stone-500">表示できる変更項目はありません。</p>
        </section>

        <div class="mt-5 flex justify-end gap-2">
          <button :disabled="processingId === revision.id" class="min-h-11 rounded border border-red-300 px-4 py-2 text-red-700 disabled:opacity-50" @click="openReject(revision)">却下</button>
          <button :disabled="processingId === revision.id || revision.review.stale || !revision.review.valid" class="min-h-11 rounded bg-green-700 px-4 py-2 text-white disabled:opacity-50" @click="approve(revision)">{{ processingId === revision.id ? '処理中…' : '承認する' }}</button>
        </div>
      </article>
      <p v-if="!(data?.revisions.length)" class="text-stone-600">承認待ちはありません。</p>
    </div>

    <UiDialog :open="Boolean(rejectTarget)" title="変更申請を却下" description="この申請は承認待ち一覧から外れます。申請者が判断を理解できる理由を入力してください。" max-width="sm" @close="rejectTarget = null">
      <form @submit.prevent="reject">
        <label for="reject-reason" class="text-sm font-semibold">却下理由</label>
        <textarea id="reject-reason" v-model="rejectReason" required maxlength="1000" rows="5" class="dm-field-focus mt-2 w-full rounded-lg border border-stone-300 px-3 py-2" />
        <div class="mt-5 flex justify-end gap-2">
          <button type="button" :disabled="Boolean(processingId)" class="min-h-11 rounded-lg border border-stone-300 px-4 py-2" @click="rejectTarget = null">キャンセル</button>
          <button :disabled="!rejectReason.trim() || Boolean(processingId)" class="min-h-11 rounded-lg bg-red-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{{ processingId ? '却下中…' : '却下する' }}</button>
        </div>
      </form>
    </UiDialog>
  </section>
</template>
