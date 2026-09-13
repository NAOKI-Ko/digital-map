<script setup lang="ts">
import { mapCreateSchema, type MapCreateInput } from '~~/shared/schemas/map'
import type { AdminMapResponse } from '~~/shared/types/map'

definePageMeta({ layout: 'admin', middleware: 'auth' })
useHead({ title: '新しいマップを作る | デジタルマップ' })

const selectedType = ref<'illustration' | null>(null)
const form = reactive({ name: '', slug: '' })
const errorMessage = ref('')
const isSubmitting = ref(false)
const isDirty = computed(() => selectedType.value !== null || form.name !== '' || form.slug !== '')

function suggestSlug() {
  if (form.slug || !form.name) return
  form.slug = form.name.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

async function createMap() {
  const result = mapCreateSchema.safeParse({ mapType: selectedType, ...form })
  if (!result.success) {
    errorMessage.value = result.error.issues[0]?.message ?? '入力内容を確認してください。'
    return
  }
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    const body: MapCreateInput = result.data
    const response = await $fetch<AdminMapResponse>('/api/maps', { method: 'POST', body })
    await navigateTo(`/admin/maps/${response.map.id}/setup`)
  }
  catch (error: any) {
    errorMessage.value = error?.data?.statusMessage ?? 'マップを作成できませんでした。公開パスが既に使われていないか確認してください。'
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl">
    <NuxtLink to="/admin/dashboard" class="text-sm font-medium text-stone-600">← マップ一覧に戻る</NuxtLink>
    <header class="mt-5">
      <p class="text-sm font-medium text-terracotta-700">新規作成</p>
      <h1 class="mt-1 text-3xl font-bold text-stone-900">新しいマップを作る</h1>
    </header>

    <section v-if="!selectedType" class="mt-8 grid gap-5 sm:grid-cols-2">
      <button type="button" class="rounded-2xl border-2 border-terracotta-500 bg-white p-7 text-left shadow-sm" @click="selectedType = 'illustration'">
        <span class="text-xl font-bold text-stone-900">イラストマップ</span>
        <span class="mt-3 block text-sm leading-6 text-stone-600">フロアのイラスト上にSpotを配置します。</span>
        <span class="mt-5 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">作成できます</span>
      </button>
      <div aria-disabled="true" class="rounded-2xl border border-stone-300 bg-stone-100 p-7 text-left opacity-75">
        <span class="text-xl font-bold text-stone-700">リアルマップ</span>
        <span class="mt-3 block text-sm leading-6 text-stone-500">地理座標を中心にした別の作成方式です。</span>
        <span class="mt-5 inline-flex rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-stone-700">今後対応予定</span>
      </div>
    </section>

    <section v-else class="mt-8 rounded-2xl border border-stone-200 bg-white p-7 shadow-sm">
      <button type="button" class="text-sm font-semibold text-stone-600" @click="selectedType = null">← 種別を選び直す</button>
      <h2 class="mt-5 text-xl font-bold">イラストマップの基本情報</h2>
      <form class="mt-6 space-y-5" @submit.prevent="createMap">
        <label class="block text-sm font-semibold">マップ名 <span class="text-red-600">必須</span>
          <input v-model="form.name" maxlength="100" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5" @blur="suggestSlug">
        </label>
        <label class="block text-sm font-semibold">公開パス <span class="text-red-600">必須</span>
          <span class="mt-2 flex items-center rounded-lg border border-stone-300 bg-white"><span class="pl-3 text-stone-500">/</span><input v-model="form.slug" maxlength="80" class="min-w-0 flex-1 px-2 py-2.5" placeholder="arimatsu-guide"></span>
          <span class="mt-1 block text-xs font-normal text-stone-500">公開URLに使います。作成後は既存リンク保護のため変更できません。</span>
        </label>
        <p v-if="errorMessage" role="alert" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ errorMessage }}</p>
        <button type="submit" :disabled="isSubmitting" class="rounded-lg bg-terracotta-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{{ isSubmitting ? '作成中…' : 'マップを作成してセットアップへ' }}</button>
      </form>
    </section>
  </div>
  <UnsavedChangesGuard :dirty="isDirty && !isSubmitting" />
</template>
