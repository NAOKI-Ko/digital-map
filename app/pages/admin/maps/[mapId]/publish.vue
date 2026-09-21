<script setup lang="ts">
import PublicSharePanel from '~/components/admin/PublicSharePanel.vue'
import { buildPublicMapUrl } from '~~/shared/utils/public-url'
import { resolvePublicationToggleAction } from '~~/shared/utils/map-publication'
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
const { success } = useToast()
const configuredPublicOrigin = useRuntimeConfig().public.publicBaseUrl as string
const publicUrl = computed(() => data.value
  ? buildPublicMapUrl(configuredPublicOrigin, data.value.map.slug)
  : '')

useHead(() => ({
  title: `${data.value?.map.name ?? '公開設定'} | デジタルマップ`,
}))

async function togglePublication() {
  if (!data.value) return

  isSaving.value = true
  errorMessage.value = ''
  const currentReleaseId = releaseData.value?.currentReleaseId
  const action = resolvePublicationToggleAction(data.value.map.isPublished, currentReleaseId)

  try {
    if (action === 'resume-current-release') {
      if (!currentReleaseId) throw new Error('CURRENT_RELEASE_NOT_READY')
      await $fetch(`/api/maps/${mapId}/releases/${currentReleaseId}/rollback`, { method: 'POST' })
      data.value.map.isPublished = true
      success('公開停止前の版を再公開しました。公開URLから閲覧できます', 'map-publication')
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
    success(response.publication.isPublished ? 'マップを公開しました。公開URLから閲覧できます' : 'マップを非公開にしました', 'map-publication')
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
    success('最新の編集内容から新しい公開版を作成しました', 'map-publication')
    await refreshReleases()
  }
  catch {
    errorMessage.value = '新しい公開版を作成できませんでした。画像や公開内容を確認してください。'
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
    if (data.value) data.value.map.isPublished = true
    success('選択した過去リリースへ内容を戻しました', 'map-publication')
  }
  catch { errorMessage.value = 'リリースを切り戻せませんでした。' }
  finally { isSaving.value = false }
}
</script>

<template>
  <div class="max-w-6xl">
    <NuxtLink :to="`/admin/maps/${mapId}/settings`" class="text-sm font-medium text-stone-600 hover:text-stone-900">
      ← マップ設定に戻る
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
        <p class="mt-2 text-sm leading-6 text-stone-600">マップ全体を公開するか、下書きとして非公開にするかを切り替えます。</p>
      </header>

      <section class="mt-6 border-y border-stone-200 py-5">
        <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div class="flex items-center gap-3">
              <h2 class="text-lg font-bold text-stone-900">公開ステータス</h2>
              <span
                class="rounded-full px-3 py-1 text-xs font-semibold"
                :class="data.map.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-700'"
              >
                {{ data.map.isPublished ? '公開中' : '下書き' }}
              </span>
            </div>
            <p class="mt-2 max-w-xl text-sm leading-6 text-stone-600">
              公開すると、公開中かつ位置設定済みのスポットだけが閲覧者に表示されます。
            </p>
          </div>
          <button
            type="button"
            role="switch"
            :aria-checked="data.map.isPublished"
            :disabled="isSaving || releaseStatus === 'pending'"
            class="inline-flex min-w-48 items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            :class="data.map.isPublished ? 'bg-stone-700 hover:bg-stone-800' : 'bg-emerald-700 hover:bg-emerald-800'"
            @click="togglePublication"
          >
            {{ isSaving ? '変更中…' : data.map.isPublished ? 'マップを非公開にする' : releaseData?.currentReleaseId ? '停止前の版を再公開する' : 'マップを公開する' }}
          </button>
        </div>

        <div v-if="!data.map.isPublished && releaseData?.currentReleaseId" class="mt-4 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
          <p>停止前の版ではなく、現在の編集内容から新しい公開版を作る場合はこちらを使用します。</p>
          <button type="button" class="mt-3 rounded border border-stone-300 bg-white px-3 py-2 text-xs font-semibold hover:bg-stone-100 disabled:opacity-60" :disabled="isSaving" @click="publishLatest">最新内容を公開する</button>
        </div>

        <p v-if="errorMessage" role="alert" class="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{{ errorMessage }}</p>
      </section>

      <section v-if="releaseData?.releases.length" class="mt-7 border-t border-stone-200 pt-5">
        <h2 class="text-lg font-bold">公開リリース履歴</h2>
        <p class="mt-1 text-sm text-stone-600">各版の内容は保存されています。以前の版へ戻すと、その内容が公開されます。</p>
        <ul class="mt-4 divide-y divide-stone-200">
          <li v-for="release in releaseData.releases" :key="release.id" class="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
            <div class="min-w-0"><time :datetime="release.readyAt || release.createdAt" class="font-semibold text-stone-900">{{ releaseDate.format(new Date(release.readyAt || release.createdAt)) }}</time><p class="mt-1 text-xs text-stone-500">公開用の内容を作成済み · 日本時間</p><details class="mt-2 text-xs text-stone-500"><summary class="cursor-pointer">技術情報</summary><p class="mt-2 break-all">リリースID: {{ release.id }}</p></details></div>
            <span v-if="release.id === releaseData.currentReleaseId" class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">{{ data.map.isPublished ? '現在公開中の版' : '公開停止中の版' }}</span>
            <button v-else type="button" class="rounded border px-3 py-2 text-xs font-semibold" :disabled="isSaving" @click="rollbackRelease(release.id)">この版へ戻す</button>
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
    </template>
  </div>
</template>
