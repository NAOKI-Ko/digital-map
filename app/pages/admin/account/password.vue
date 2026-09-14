<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
const currentPassword = ref('')
const newPassword = ref('')
const error = ref('')
async function change() { try { await $fetch('/api/auth/password/change', { method: 'POST', body: { currentPassword: currentPassword.value, newPassword: newPassword.value } }); await navigateTo('/admin/login') } catch (reason: any) { error.value = reason?.data?.statusMessage ?? '変更できませんでした。' } }
</script>
<template><section class="mx-auto max-w-lg rounded-2xl bg-white p-6"><h1 class="text-2xl font-bold">パスワード変更</h1><p class="mt-2 text-sm text-stone-600">変更後はすべての端末からログアウトします。</p><form class="mt-6 space-y-4" @submit.prevent="change"><label class="block text-sm font-semibold">現在のパスワード<input v-model="currentPassword" required type="password" autocomplete="current-password" class="mt-2 w-full rounded border px-3 py-2"></label><label class="block text-sm font-semibold">新しいパスワード<input v-model="newPassword" required minlength="12" type="password" autocomplete="new-password" class="mt-2 w-full rounded border px-3 py-2"></label><p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p><button class="rounded bg-stone-900 px-4 py-3 font-semibold text-white">変更してログアウト</button></form></section></template>
