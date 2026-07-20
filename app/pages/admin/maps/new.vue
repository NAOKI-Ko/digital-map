<script setup lang="ts">
import MapNameForm from '~/components/admin/MapNameForm.vue'
import type { MapNameInput } from '~~/shared/schemas/map'
import type { AdminMapResponse } from '~~/shared/types/map'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

useHead({ title: '新しいマップを作る | デジタルマップ' })

const isSubmitting = ref(false)
const submitError = ref('')

async function createMap(input: MapNameInput) {
  isSubmitting.value = true
  submitError.value = ''

  try {
    const response = await $fetch<AdminMapResponse>('/api/maps', {
      method: 'POST',
      body: input,
    })
    await navigateTo(`/admin/maps/${response.map.id}/settings`)
  }
  catch {
    submitError.value = 'マップを作成できませんでした。時間をおいて、もう一度お試しください。'
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl">
    <NuxtLink to="/admin/dashboard" class="text-sm font-medium text-stone-600 hover:text-stone-900">
      ← マップ一覧に戻る
    </NuxtLink>
    <header class="mt-5">
      <p class="text-sm font-medium text-terracotta-700">
        新規作成
      </p>
      <h1 class="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
        新しいマップを作る
      </h1>
      <p class="mt-2 text-sm leading-6 text-stone-600">
        まずはマップ名を決めます。イラスト画像やフロアは、作成後に追加できます。
      </p>
    </header>

    <section class="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <div v-if="submitError" role="alert" class="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ submitError }}
      </div>
      <MapNameForm
        submit-label="マップを作成する"
        :is-submitting="isSubmitting"
        @submit="createMap"
      />
    </section>
  </div>
</template>
