<script setup lang="ts">
definePageMeta({ layout: false })
const route = useRoute()
const email = ref('')
const password = ref('')
const resetUrl = ref('')
const done = ref(false)
async function requestReset() { const result = await $fetch('/api/auth/password/reset-request', { method: 'POST', body: { email: email.value } }); resetUrl.value = result.resetUrl ?? ''; done.value = true }
async function reset() { await $fetch('/api/auth/password/reset', { method: 'POST', body: { token: String(route.query.token ?? ''), password: password.value } }); await navigateTo('/admin/login') }
</script>
<template><main class="mx-auto max-w-md px-6 py-16"><h1 class="text-2xl font-bold">パスワード再設定</h1><form v-if="route.query.token" class="mt-6 space-y-4" @submit.prevent="reset"><label class="block text-sm font-semibold">新しいパスワード<input v-model="password" required minlength="12" type="password" autocomplete="new-password" class="mt-2 w-full rounded border px-3 py-2"></label><button class="w-full rounded bg-stone-900 px-4 py-3 font-semibold text-white">変更してログインへ</button></form><form v-else class="mt-6 space-y-4" @submit.prevent="requestReset"><label class="block text-sm font-semibold">メールアドレス<input v-model="email" required type="email" class="mt-2 w-full rounded border px-3 py-2"></label><button class="w-full rounded bg-stone-900 px-4 py-3 font-semibold text-white">再設定メールを依頼</button><p v-if="done" class="text-sm">該当するアカウントがある場合は再設定案内を送ります。</p><a v-if="resetUrl" :href="resetUrl" class="block break-all text-xs underline">開発・QA用の再設定リンク</a></form></main></template>
