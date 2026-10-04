<script setup lang="ts">
import { signupResendSchema } from '~~/shared/schemas/signup'

const email = ref('')
const busy = ref(false)
const message = ref('')
const error = ref('')
const devUrl = ref('')
async function resend() {
  if (busy.value) return
  const parsed = signupResendSchema.safeParse({ email: email.value })
  if (!parsed.success) { error.value = parsed.error.issues[0]?.message ?? 'メールアドレスを確認してください。'; return }
  busy.value = true; error.value = ''; message.value = ''; devUrl.value = ''
  try {
    const result = await $fetch<{ verificationUrl?: string }>('/api/signup/resend', { method: 'POST', body: parsed.data })
    message.value = '未完了の登録がある場合、確認メールを再送しました。最新のメール内のリンクを使ってください。'
    devUrl.value = result.verificationUrl ?? ''
  }
  catch { error.value = '再送できませんでした。時間をおいて、もう一度お試しください。' }
  finally { busy.value = false }
}
</script>
<template>
  <form class="mt-6 border-t border-stone-200 pt-5 text-left" @submit.prevent="resend">
    <h2 class="text-base font-bold">確認メールを再送</h2>
    <label class="mt-3 block text-sm">登録時のメールアドレス<input v-model="email" type="email" required autocomplete="email" class="mt-2 min-h-11 w-full rounded-lg border border-stone-300 px-3"></label>
    <button type="submit" :disabled="busy" class="mt-3 min-h-11 rounded-lg border border-stone-300 px-4 text-sm font-semibold disabled:opacity-50">{{ busy ? '再送中…' : '確認メールを再送する' }}</button>
    <p v-if="error" role="alert" class="mt-3 text-sm text-red-700">{{ error }}</p>
    <p v-if="message" role="status" class="mt-3 text-sm leading-6">{{ message }}</p>
    <a v-if="devUrl" :href="devUrl" class="mt-3 inline-flex min-h-11 items-center text-sm underline">開発環境: 最新の確認リンクを開く</a>
  </form>
</template>
