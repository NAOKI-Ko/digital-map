<script setup lang="ts">
import { signupSchema } from '~~/shared/schemas/signup'

definePageMeta({ layout: false })
useHead({ title: '新規登録 | デジタルマップ' })
const form = reactive({ email: '', password: '', organizationName: '', acceptTerms: false, acceptPrivacy: false })
const busy = ref(false)
const error = ref('')
const submitted = ref(false)
const devUrl = ref('')
async function submit() {
  const parsed = signupSchema.safeParse(form)
  if (!parsed.success) { error.value = parsed.error.issues[0]?.message ?? '入力内容を確認してください。'; return }
  busy.value = true; error.value = ''
  try {
    const result = await $fetch<{ verificationUrl?: string }>('/api/signup', { method: 'POST', body: parsed.data })
    submitted.value = true; devUrl.value = result.verificationUrl ?? ''
  }
  catch (reason: any) { error.value = reason?.data?.statusMessage ?? '登録を受け付けられませんでした。' }
  finally { busy.value = false }
}
</script>

<template>
  <main class="min-h-screen bg-stone-100 px-5 py-12"><section class="mx-auto max-w-lg rounded-2xl bg-white p-8 shadow-sm">
    <p class="text-sm font-semibold tracking-widest text-terracotta-700">DIGITAL MAP</p><h1 class="mt-3 text-2xl font-bold">組織アカウントを作成</h1>
    <div v-if="submitted" role="status" class="mt-6 rounded-xl bg-emerald-50 p-5 text-sm leading-6 text-emerald-900">確認メールを送信しました。メール内のリンクから登録を完了してください。<a v-if="devUrl" :href="devUrl" class="mt-3 block font-semibold underline">開発環境: 確認リンクを開く</a></div>
    <form v-else class="mt-7 space-y-5" @submit.prevent="submit">
      <label class="block text-sm font-semibold">メールアドレス<input v-model="form.email" type="email" autocomplete="email" required class="mt-2 w-full rounded-lg border p-3"></label>
      <label class="block text-sm font-semibold">パスワード（12文字以上）<input v-model="form.password" type="password" autocomplete="new-password" minlength="12" required class="mt-2 w-full rounded-lg border p-3"></label>
      <label class="block text-sm font-semibold">組織名<input v-model="form.organizationName" required maxlength="100" class="mt-2 w-full rounded-lg border p-3"></label>
      <label class="flex gap-3 text-sm"><input v-model="form.acceptTerms" type="checkbox" required><span><NuxtLink to="/terms" target="_blank" class="underline">利用規約</NuxtLink>に同意します</span></label>
      <label class="flex gap-3 text-sm"><input v-model="form.acceptPrivacy" type="checkbox" required><span><NuxtLink to="/privacy" target="_blank" class="underline">プライバシーポリシー</NuxtLink>に同意します</span></label>
      <p v-if="error" role="alert" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
      <button type="submit" :disabled="busy" class="w-full rounded-lg bg-terracotta-600 p-3 font-semibold text-white disabled:opacity-50">{{ busy ? '送信中…' : '確認メールを送信' }}</button>
    </form>
    <p class="mt-6 text-center text-sm"><NuxtLink to="/admin/login" class="underline">登録済みの方はログイン</NuxtLink></p>
  </section></main>
</template>
