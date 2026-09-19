<script setup lang="ts">
import SaveFeedback from '~/components/ui/SaveFeedback.vue'
import UnsavedChangesGuard from '~/components/admin/UnsavedChangesGuard.vue'
import { mapCreateSchema, type MapCreateInput } from '~~/shared/schemas/map'
import type { AdminMapResponse } from '~~/shared/types/map'

definePageMeta({ layout: 'admin', middleware: 'auth' })
useHead({ title: '新しいマップを作る | デジタルマップ' })

const form = reactive({ name: '', slug: '' })
const errorMessage = ref('')
const isSubmitting = ref(false)
const isDirty = computed(() => form.name !== '' || form.slug !== '')

function suggestSlug() {
  if (form.slug || !form.name) return
  form.slug = form.name.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

async function createMap() {
  const result = mapCreateSchema.safeParse({ mapType: 'illustration', ...form })
  if (!result.success) {
    errorMessage.value = result.error.issues[0]?.message ?? '入力内容を確認してください。'
    return
  }
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    const body: MapCreateInput = result.data
    const response = await $fetch<AdminMapResponse>('/api/maps', { method: 'POST', body })
    await navigateTo({ path: `/admin/maps/${response.map.id}/setup`, query: { saved: 'map-created' } })
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
  <div class="max-w-2xl">
    <NuxtLink to="/admin/dashboard" class="text-sm font-medium text-stone-600">← ワークスペースに戻る</NuxtLink>
    <header class="mt-5">
      <p class="text-sm font-medium text-terracotta-700">新規作成</p>
      <h1 class="mt-1 text-3xl font-bold text-stone-900">ワークスペースのマップを作る</h1>
      <p class="mt-2 text-sm leading-6 text-stone-600">1つのマップにスポットやカテゴリーを登録し、イラスト表示を設定します。リアルマップは同じマップの表示機能として今後追加されます。</p>
      <p aria-disabled="true" class="mt-3 text-xs font-semibold text-stone-500">リアルマップの表示UIは今後対応予定です。</p>
    </header>

    <section class="mt-8 rounded-xl border border-stone-200 bg-white p-6 sm:p-7">
      <h2 class="text-xl font-bold">基本情報</h2>
      <form class="mt-6 space-y-5" @submit.prevent="createMap">
        <label class="block text-sm font-semibold">マップ名 <span class="text-red-600">必須</span>
          <input v-model="form.name" maxlength="100" class="dm-input mt-2" @blur="suggestSlug">
        </label>
        <label class="block text-sm font-semibold">公開パス <span class="text-red-600">必須</span>
          <span class="mt-2 flex items-center rounded-lg border border-stone-300 bg-white focus-within:border-terracotta-600 focus-within:ring-2 focus-within:ring-terracotta-100"><span class="pl-3 text-stone-500">/</span><input v-model="form.slug" maxlength="80" class="min-h-11 min-w-0 flex-1 rounded-lg px-2 py-2.5 outline-none" placeholder="arimatsu-guide"></span>
          <span class="mt-1 block text-xs font-normal text-stone-500">公開URLに使います。作成後は既存リンク保護のため変更できません。</span>
        </label>
        <SaveFeedback :state="isSubmitting ? 'saving' : errorMessage ? 'error' : 'idle'" :message="errorMessage" />
        <UiFormActions><UiButton variant="secondary" @click="navigateTo('/admin/dashboard')">キャンセル</UiButton><UiButton type="submit" :busy="isSubmitting" :disabled="isSubmitting">{{ isSubmitting ? '作成中…' : 'マップを作成してセットアップへ' }}</UiButton></UiFormActions>
      </form>
    </section>
  </div>
  <UnsavedChangesGuard :dirty="isDirty && !isSubmitting" />
</template>
