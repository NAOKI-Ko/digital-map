<script setup lang="ts">
definePageMeta({ layout: false })
const route = useRoute()
const password = ref('')
const error = ref('')
const accepted = ref(false)
async function accept() {
  error.value = ''
  try {
    await $fetch('/api/auth/invitations/accept', { method: 'POST', body: { token: String(route.query.token ?? ''), password: password.value || undefined } })
    accepted.value = true
  }
  catch (reason: any) { error.value = reason?.data?.statusMessage ?? '招待を承認できませんでした。' }
}
</script>
<template><main class="mx-auto max-w-md px-6 py-16"><h1 class="text-2xl font-bold">ワークスペースへの招待</h1><p class="mt-3 text-sm text-stone-600">既存ユーザーは先にログインしてください。初めて利用する場合は12文字以上のパスワードを設定します。</p><p v-if="accepted" class="mt-6 rounded bg-green-50 p-4">招待を承認しました。<NuxtLink class="underline" to="/admin/login">ログインへ</NuxtLink></p><form v-else class="mt-6 space-y-4" @submit.prevent="accept"><label class="block text-sm font-semibold">新規ユーザー用パスワード<input v-model="password" type="password" autocomplete="new-password" minlength="12" class="mt-2 w-full rounded border px-3 py-2"></label><p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p><button class="w-full rounded bg-stone-900 px-4 py-3 font-semibold text-white">招待を承認</button></form></main></template>
