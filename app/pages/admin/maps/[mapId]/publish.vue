<script setup lang="ts">
import PublicSharePanel from '~/components/admin/PublicSharePanel.vue'
import PaperExportPanel from '~/components/admin/PaperExportPanel.vue'
import { buildPublicMapUrl } from '~~/shared/utils/public-url'
import type { AdminMapResponse } from '~~/shared/types/map'
import type { MapPublicationResponse } from '~~/shared/types/map-publication'
import type { MapFloorListResponse } from '~~/shared/types/floor'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const route = useRoute()
const mapId = route.params.mapId as string
const { data, error, status } = await useFetch<AdminMapResponse>(`/api/maps/${mapId}`)
const { data: floorData } = await useFetch<MapFloorListResponse>(`/api/maps/${mapId}/floors`)
const { data: releaseData, refresh: refreshReleases } = await useFetch<{ currentReleaseId: string | null, releases: Array<{ id: string, createdAt: string, readyAt: string | null }> }>(`/api/maps/${mapId}/releases`)
const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
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
  successMessage.value = ''
  const nextState = !data.value.map.isPublished

  try {
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
    successMessage.value = response.publication.isPublished
      ? 'マップを公開しました。公開URLから閲覧できます。'
      : 'マップを非公開にしました。公開URLからは閲覧できません。'
    await refreshReleases()
  }
  catch {
    errorMessage.value = '公開状態を変更できませんでした。もう一度お試しください。'
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
    successMessage.value = '選択した過去リリースへ公開ポインターを戻しました。'
  }
  catch { errorMessage.value = 'リリースを切り戻せませんでした。' }
  finally { isSaving.value = false }
}
</script>

<template>
  <div class="max-w-4xl">
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

      <section class="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
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
            :disabled="isSaving"
            class="inline-flex min-w-48 items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            :class="data.map.isPublished ? 'bg-stone-700 hover:bg-stone-800' : 'bg-emerald-700 hover:bg-emerald-800'"
            @click="togglePublication"
          >
            {{ isSaving ? '変更中…' : data.map.isPublished ? 'マップを非公開にする' : 'マップを公開する' }}
          </button>
        </div>

        <p v-if="errorMessage" role="alert" class="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{{ errorMessage }}</p>
        <p v-if="successMessage" role="status" class="mt-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{{ successMessage }}</p>
      </section>

      <section v-if="releaseData?.releases.length" class="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 class="text-lg font-bold">公開リリース履歴</h2>
        <p class="mt-1 text-sm text-stone-600">READY済みの内容は変更されません。以前のリリースへ安全に切り戻せます。</p>
        <ul class="mt-4 space-y-2">
          <li v-for="release in releaseData.releases" :key="release.id" class="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
            <span><strong>{{ release.id }}</strong><br><span class="text-xs text-stone-500">{{ release.readyAt }}</span></span>
            <span v-if="release.id === releaseData.currentReleaseId" class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">現在</span>
            <button v-else type="button" class="rounded border px-3 py-2 text-xs font-semibold" :disabled="isSaving" @click="rollbackRelease(release.id)">この版へ戻す</button>
          </li>
        </ul>
      </section>

      <div class="mt-6">
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
      <div class="mt-6">
        <PaperExportPanel :map-id="mapId" :floors="floorData?.floors ?? []" :is-published="data.map.isPublished" />
      </div>
    </template>
  </div>
</template>
