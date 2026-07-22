<script setup lang="ts">
import type { AdminMapResponse } from '~~/shared/types/map'
import type { MapPublicationResponse } from '~~/shared/types/map-publication'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const route = useRoute()
const mapId = route.params.mapId as string
const { data, error, status } = await useFetch<AdminMapResponse>(`/api/maps/${mapId}`)
const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

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
  }
  catch {
    errorMessage.value = '公開状態を変更できませんでした。もう一度お試しください。'
  }
  finally {
    isSaving.value = false
  }
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
    </template>
  </div>
</template>
