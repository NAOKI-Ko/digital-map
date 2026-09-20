<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
const route = useRoute()
const acceptTerms = ref(false), acceptPrivacy = ref(false), busy = ref(false), error = ref('')
async function complete() {
  busy.value = true; error.value = ''
  try { const result = await $fetch<{ redirect: string }>('/api/signup/complete-existing', { method: 'POST', body: { intentId: route.query.intent, acceptTerms: acceptTerms.value, acceptPrivacy: acceptPrivacy.value } }); await navigateTo(result.redirect) }
  catch { error.value = '登録手続きを完了できませんでした。確認リンクとログインアカウントを確認してください。' }
  finally { busy.value = false }
}
</script>
<template><div class="mx-auto max-w-lg"><h1 class="text-2xl font-bold">新しいワークスペースを作成</h1><p class="mt-3 text-sm leading-6 text-stone-600">メール確認済みのワークスペース登録を、このログインアカウントで完了します。</p><form class="mt-7 space-y-4 rounded-2xl bg-white p-7 shadow-sm" @submit.prevent="complete"><label class="flex gap-3"><input v-model="acceptTerms" type="checkbox" required><span><NuxtLink to="/terms" class="underline">利用規約</NuxtLink>に同意します</span></label><label class="flex gap-3"><input v-model="acceptPrivacy" type="checkbox" required><span><NuxtLink to="/privacy" class="underline">プライバシーポリシー</NuxtLink>に同意します</span></label><p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p><button :disabled="busy" class="rounded-lg bg-terracotta-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{{ busy ? '作成中…' : 'ワークスペースを作成' }}</button></form></div></template>
