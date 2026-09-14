<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'メール確認 | デジタルマップ' })
const route = useRoute()
const state = ref<'loading' | 'done' | 'error'>('loading')
const redirect = ref('/admin/login')
onMounted(async () => {
  try {
    const result = await $fetch<{ redirect: string }>('/api/signup/verify', { method: 'POST', body: { token: route.query.token } })
    redirect.value = result.redirect; state.value = 'done'
  }
  catch { state.value = 'error' }
})
</script>
<template><main class="grid min-h-screen place-items-center bg-stone-100 p-6"><section class="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm"><h1 class="text-2xl font-bold">メールアドレスの確認</h1><p v-if="state === 'loading'" role="status" class="mt-5">確認しています…</p><template v-else-if="state === 'done'"><p class="mt-5 leading-7">確認が完了しました。次の画面へ進んでください。</p><NuxtLink :to="redirect" class="mt-6 inline-flex rounded-lg bg-terracotta-600 px-5 py-3 font-semibold text-white">登録を続ける</NuxtLink></template><template v-else><p role="alert" class="mt-5 text-red-700">リンクが無効または期限切れです。</p><NuxtLink to="/signup" class="mt-5 inline-block underline">登録画面へ戻る</NuxtLink></template></section></main></template>
