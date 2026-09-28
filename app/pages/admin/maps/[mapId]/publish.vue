<script setup lang="ts">
import PublicSharePanel from '~/components/admin/PublicSharePanel.vue'
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue'
import { buildPublicMapUrl } from '~~/shared/utils/public-url'
import { resolvePublicationToggleAction } from '~~/shared/utils/map-publication'
import { visitorPreviewPath } from '~~/shared/utils/visitor-preview'
import { mapVisibilityLabel, releaseSourceLabel } from '~/utils/admin-publication-copy'
import type { AdminMapResponse } from '~~/shared/types/map'
import type { MapPublicationResponse } from '~~/shared/types/map-publication'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const route = useRoute()
const mapId = route.params.mapId as string
const { data, error, status } = await useFetch<AdminMapResponse>(`/api/maps/${mapId}`)
const { data: releaseData, status: releaseStatus, refresh: refreshReleases } = await useFetch<{ currentReleaseId: string | null, releases: Array<{ id: string, createdAt: string, readyAt: string | null }> }>(`/api/maps/${mapId}/releases`)
const isSaving = ref(false)
const releaseDate = new Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tokyo' })
const errorMessage = ref('')
const rollbackTarget = ref<{ id: string, createdAt: string, readyAt: string | null } | null>(null)
const { success } = useToast()
const configuredPublicOrigin = useRuntimeConfig().public.publicBaseUrl as string
const publicUrl = computed(() => data.value
  ? buildPublicMapUrl(configuredPublicOrigin, data.value.map.slug)
  : '')
const hasReadyCurrentRelease = computed(() => Boolean(releaseData.value?.currentReleaseId && releaseData.value.releases.some(release => release.id === releaseData.value?.currentReleaseId)))

useHead(() => ({
  title: `${data.value?.map.name ?? '公開設定'} | デジタルマップ`,
}))

async function togglePublication() {
  if (!data.value) return

  isSaving.value = true
  errorMessage.value = ''
  const currentReleaseId = releaseData.value?.currentReleaseId
  const action = resolvePublicationToggleAction(data.value.map.isPublished, hasReadyCurrentRelease.value ? currentReleaseId : null)

  try {
    if (action === 'resume-current-release') {
      if (!currentReleaseId) throw new Error('CURRENT_RELEASE_NOT_READY')
      await $fetch(`/api/maps/${mapId}/releases/${currentReleaseId}/rollback`, { method: 'POST' })
      data.value = { map: { ...data.value.map, isPublished: true } }
      success('前回公開した内容を再公開しました。閲覧者が表示できます。', 'map-publication')
      await refreshReleases()
      return
    }

    const nextState = action === 'publish-latest'
    const response = await $fetch<MapPublicationResponse>(`/api/maps/${mapId}/publish`, {
      method: 'POST',
      body: { isPublished: nextState },
    })
    data.value = {
      map: {
        ...data.value.map,
        isPublished: response.publication.isPublished,
        updatedAt: response.publication.updatedAt,
      },
    }
    success(response.publication.isPublished ? '編集中の内容を公開しました。閲覧者が表示できます。' : 'マップを非公開にしました。閲覧者からは表示されません。', 'map-publication')
    await refreshReleases()
  }
  catch {
    errorMessage.value = '公開状態を変更できませんでした。もう一度お試しください。'
  }
  finally {
    isSaving.value = false
  }
}

async function publishLatest() {
  if (!data.value) return
  isSaving.value = true
  errorMessage.value = ''
  try {
    const response = await $fetch<MapPublicationResponse>(`/api/maps/${mapId}/publish`, {
      method: 'POST',
      body: { isPublished: true },
    })
    data.value = {
      map: {
        ...data.value.map,
        isPublished: response.publication.isPublished,
        updatedAt: response.publication.updatedAt,
      },
    }
    success('編集中の内容を公開しました。閲覧者に表示される内容を更新しました。', 'map-publication')
    await refreshReleases()
  }
  catch {
    errorMessage.value = '編集中の内容を公開できませんでした。画像や公開対象を確認してください。'
  }
  finally {
    isSaving.value = false
  }
}

async function rollbackRelease(releaseId: string) {
  isSaving.value = true
  errorMessage.value = ''
  try {
    await $fetch(`/api/maps/${mapId}/releases/${releaseId}/rollback`, { method: 'POST' })
    await refreshReleases()
    if (data.value) data.value = { map: { ...data.value.map, isPublished: true } }
    const release = releaseData.value?.releases.find(item => item.id === releaseId)
    success(`${release ? releaseDate.format(new Date(release.readyAt || release.createdAt)) : '選択した公開履歴'}の内容を公開しました。閲覧者に表示されます。`, 'map-publication')
    rollbackTarget.value = null
  }
  catch { errorMessage.value = '選択した公開履歴の内容を公開できませんでした。'; rollbackTarget.value = null }
  finally { isSaving.value = false }
}
</script>

<template>
  <div class="max-w-6xl">
    <NuxtLink :to="`/admin/maps/${mapId}`" class="text-sm font-medium text-stone-600 hover:text-stone-900">
      ← マップのホームに戻る
    </NuxtLink>

    <section v-if="status === 'pending'" class="mt-8 rounded-2xl bg-white p-8 text-sm text-stone-600 shadow-sm">
      公開設定を読み込んでいます…
    </section>
    <section v-else-if="error || !data" class="mt-8 rounded-2xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">
      マップの公開設定を読み込めませんでした。
    </section>
    <template v-else>
      <header class="mt-5">
        <p class="text-sm font-medium text-terracotta-700">公開設定</p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">{{ data.map.name }}</h1>
        <p class="mt-2 text-sm leading-6 text-stone-600">マップの見え方と、閲覧者に表示する内容を管理します。編集中の変更は、公開するまで閲覧者には反映されません。</p>
      </header>

      <section class="mt-6 border-y border-stone-200 py-5">
        <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div class="flex items-center gap-3">
              <h2 class="text-lg font-bold text-stone-900">マップの公開状態</h2>
              <span
                class="rounded-full px-3 py-1 text-xs font-semibold"
                :class="data.map.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-700'"
              >
                {{ mapVisibilityLabel(data.map.isPublished) }}
              </span>
            </div>
            <p class="mt-2 max-w-xl text-sm leading-6 text-stone-600">
              {{ data.map.isPublished ? '閲覧者は公開中の内容を表示できます。' : '閲覧者は現在このマップを表示できません。' }} 公開対象かつ位置設定済みのスポットが掲載候補です。
            </p>
          </div>
          <button
            type="button"
            :disabled="isSaving || releaseStatus === 'pending'"
            class="inline-flex min-w-48 items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            :class="data.map.isPublished ? 'bg-stone-700 hover:bg-stone-800' : 'bg-emerald-700 hover:bg-emerald-800'"
            @click="togglePublication"
          >
            {{ isSaving ? '変更中…' : data.map.isPublished ? 'マップを非公開にする' : hasReadyCurrentRelease ? '前回公開した内容を再公開する' : '編集中の内容を公開する' }}
          </button>
        </div>

        <div class="mt-4 grid gap-3 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700 sm:grid-cols-2">
          <div><h3 class="font-semibold">編集中の内容</h3><p class="mt-1">現在編集できる情報です。公開中のマップでも、変更だけでは閲覧者の表示は変わりません。</p></div>
          <div><h3 class="font-semibold">{{ hasReadyCurrentRelease ? releaseSourceLabel(data.map.isPublished) : '公開履歴なし' }}</h3><p class="mt-1">{{ hasReadyCurrentRelease ? data.map.isPublished ? '今、閲覧者に表示されている内容です。' : '以前公開した内容を保持しています。現在は閲覧者に表示されません。' : 'まだ公開した内容はありません。' }}</p></div>
        </div>
        <NuxtLink :to="visitorPreviewPath(mapId, 'publish')" class="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg border border-terracotta-300 bg-white px-4 py-2 text-sm font-semibold text-terracotta-800 hover:bg-terracotta-50">来館者プレビューで編集中の内容を確認</NuxtLink>
        <div v-if="data.map.isPublished || hasReadyCurrentRelease" class="mt-4 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
          <p>{{ data.map.isPublished ? '公開中の内容が、編集中の内容に更新されます。' : '前回公開した内容ではなく、現在編集中の情報から閲覧者向けの公開内容を作成します。' }}</p>
          <button type="button" class="mt-3 min-h-11 rounded border border-stone-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-stone-100 disabled:opacity-60" :disabled="isSaving" @click="publishLatest">編集中の内容を公開する</button>
        </div>
        <p v-else class="mt-3 text-sm text-stone-600">現在編集中の情報から、閲覧者向けの公開内容を作成します。</p>

        <p v-if="errorMessage" role="alert" class="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{{ errorMessage }}</p>
      </section>

      <section v-if="releaseData?.releases.length" class="mt-7 border-t border-stone-200 pt-5">
        <h2 class="text-lg font-bold">公開履歴</h2>
        <p class="mt-1 text-sm text-stone-600">以前公開した内容を選ぶと、その内容が閲覧者に表示されます。</p>
        <ul class="mt-4 divide-y divide-stone-200">
          <li v-for="release in releaseData.releases" :key="release.id" class="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
            <div class="min-w-0"><time :datetime="release.readyAt || release.createdAt" class="font-semibold text-stone-900">{{ releaseDate.format(new Date(release.readyAt || release.createdAt)) }}</time><p class="mt-1 text-xs text-stone-500">公開した内容 · 日本時間</p><details class="mt-2 text-xs text-stone-500"><summary class="cursor-pointer">技術情報</summary><p class="mt-2 break-all">公開履歴 ID: {{ release.id }}</p></details></div>
            <span v-if="release.id === releaseData.currentReleaseId" class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">{{ releaseSourceLabel(data.map.isPublished) }}</span>
            <button v-else type="button" class="min-h-11 rounded border px-3 py-2 text-xs font-semibold" :disabled="isSaving" @click="rollbackTarget = release">この内容を公開する</button>
          </li>
        </ul>
      </section>

      <div class="mt-7 grid items-start gap-5 lg:grid-cols-2">
      <div>
        <ClientOnly>
          <PublicSharePanel
            :map-name="data.map.name"
            :map-slug="data.map.slug"
            :public-url="publicUrl"
            :is-published="data.map.isPublished"
          />
          <template #fallback>
            <section class="h-96 animate-pulse rounded-2xl bg-stone-200" />
          </template>
        </ClientOnly>
      </div>
      <div class="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <p class="text-sm font-medium text-terracotta-700">紙で配る</p>
        <h2 class="mt-1 text-xl font-bold text-stone-900">紙マップをかんたん作成</h2>
        <p class="mt-2 text-sm leading-6 text-stone-600">用途を選ぶだけで、読みやすいレイアウトと掲載内容を自動提案します。</p>
        <NuxtLink :to="`/admin/maps/${mapId}/paper`" class="mt-5 inline-flex min-h-11 items-center rounded-lg bg-terracotta-600 px-5 text-sm font-semibold text-white hover:bg-terracotta-700">紙マップを作る</NuxtLink>
      </div>
      </div>
      <ConfirmDialog :open="rollbackTarget !== null" title="過去の内容を公開" :message="rollbackTarget ? `${releaseDate.format(new Date(rollbackTarget.readyAt || rollbackTarget.createdAt))}の内容を閲覧者に公開します。現在マップが非公開の場合は再公開されます。` : ''" confirm-label="この内容を公開する" :busy="isSaving" @cancel="rollbackTarget = null" @confirm="rollbackTarget && rollbackRelease(rollbackTarget.id)" />
    </template>
  </div>
</template>
