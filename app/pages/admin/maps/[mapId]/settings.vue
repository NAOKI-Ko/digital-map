<script setup lang="ts">
import MapNameForm from '~/components/admin/MapNameForm.vue'
import type { MapNameInput } from '~~/shared/schemas/map'
import type { AdminMapResponse } from '~~/shared/types/map'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const route = useRoute()
const mapId = route.params.mapId as string
const { data, error, status } = await useFetch<AdminMapResponse>(`/api/maps/${mapId}`)
const isSubmitting = ref(false)
const submitError = ref('')
const successMessage = ref('')

useHead(() => ({
  title: `${data.value?.map.name ?? 'マップ設定'} | デジタルマップ`,
}))

async function saveMap(input: MapNameInput) {
  isSubmitting.value = true
  submitError.value = ''
  successMessage.value = ''

  try {
    const response = await $fetch<AdminMapResponse>(`/api/maps/${mapId}`, {
      method: 'PATCH',
      body: input,
    })
    data.value = response
    successMessage.value = 'マップ名を保存しました。'
  }
  catch {
    submitError.value = 'マップ名を保存できませんでした。もう一度お試しください。'
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl">
    <NuxtLink to="/admin/dashboard" class="text-sm font-medium text-stone-600 hover:text-stone-900">
      ← マップ一覧に戻る
    </NuxtLink>

    <section v-if="status === 'pending'" class="mt-8 rounded-2xl bg-white p-8 text-sm text-stone-600 shadow-sm">
      マップを読み込んでいます…
    </section>

    <section v-else-if="error || !data" class="mt-8 rounded-2xl border border-red-200 bg-red-50 p-8">
      <h1 class="text-lg font-bold text-red-900">
        マップが見つかりません
      </h1>
      <p class="mt-2 text-sm text-red-700">
        URLを確認するか、マップ一覧へ戻ってください。
      </p>
    </section>

    <template v-else>
      <header class="mt-5">
        <p class="text-sm font-medium text-terracotta-700">
          マップ設定
        </p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          {{ data.map.name }}
        </h1>
        <p class="mt-2 text-sm text-stone-500">
          公開パス: /{{ data.map.slug }}
        </p>
      </header>

      <section class="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div class="mb-6">
          <h2 class="text-lg font-bold text-stone-900">
            基本情報
          </h2>
          <p class="mt-1 text-sm text-stone-600">
            管理画面と公開画面に表示する名称です。
          </p>
        </div>
        <div v-if="submitError" role="alert" class="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ submitError }}
        </div>
        <div v-if="successMessage" role="status" class="mb-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {{ successMessage }}
        </div>
        <MapNameForm
          :initial-name="data.map.name"
          :is-submitting="isSubmitting"
          @submit="saveMap"
        />
      </section>

      <section class="mt-6 rounded-2xl border border-dashed border-stone-300 bg-white p-6 sm:p-8">
        <h2 class="font-bold text-stone-900">
          イラスト画像とフロア
        </h2>
        <p class="mt-2 text-sm leading-6 text-stone-600">
          次のステップで、イラスト画像のアップロードとフロア管理を追加します。
        </p>
      </section>
    </template>
  </div>
</template>
