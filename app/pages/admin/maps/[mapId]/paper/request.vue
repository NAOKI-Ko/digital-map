<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
const route = useRoute()
const mapId = route.params.mapId as string
const form = reactive({ paperMapId: typeof route.query.paperMapId === 'string' ? route.query.paperMapId : null, contactName: '', contactEmail: '', organizationName: '', desiredUse: '', desiredDate: '' })
const busy = ref(false), complete = ref(false), errorMessage = ref('')
function requestErrorMessage(error: unknown) {
  const data = typeof error === 'object' && error && 'data' in error ? (error as { data?: { statusMessage?: unknown } }).data : undefined
  return typeof data?.statusMessage === 'string' ? data.statusMessage : '相談を送信できませんでした。'
}
async function submit() {
  busy.value = true; errorMessage.value = ''
  try { await $fetch(`/api/maps/${mapId}/paper-design-requests`, { method: 'POST', body: form }); complete.value = true }
  catch (error: unknown) { errorMessage.value = requestErrorMessage(error) }
  finally { busy.value = false }
}
</script>

<template><div class="max-w-2xl"><NuxtLink :to="`/admin/maps/${mapId}/paper`" class="text-sm font-semibold text-stone-600">← 紙マップに戻る</NuxtLink><section v-if="complete" class="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-8"><h1 class="text-2xl font-bold text-emerald-900">ご相談を受け付けました</h1><p class="mt-3 text-sm leading-6 text-emerald-800">内容を確認してご連絡します。紙マップは引き続きEasy Builderで編集できます。</p></section><template v-else><header class="mt-6"><p class="text-sm font-medium text-terracotta-700">必要な方だけ</p><h1 class="mt-1 text-3xl font-bold">デザイン制作を相談する</h1><p class="mt-2 text-sm leading-6 text-stone-600">独自の紙面づくりや入稿データが必要な場合の相談窓口です。案件管理や自動見積もりは行いません。</p></header><form class="mt-7 space-y-5 rounded-2xl border border-stone-200 bg-white p-6" @submit.prevent="submit"><label class="block text-sm font-semibold">お名前<input v-model="form.contactName" required maxlength="100" class="mt-2 min-h-11 w-full rounded-lg border px-3 font-normal"></label><label class="block text-sm font-semibold">メールアドレス<input v-model="form.contactEmail" required type="email" maxlength="254" class="mt-2 min-h-11 w-full rounded-lg border px-3 font-normal"></label><label class="block text-sm font-semibold">団体名<input v-model="form.organizationName" maxlength="120" class="mt-2 min-h-11 w-full rounded-lg border px-3 font-normal"></label><label class="block text-sm font-semibold">用途・ご希望<textarea v-model="form.desiredUse" required maxlength="1000" rows="5" class="mt-2 w-full rounded-lg border p-3 font-normal"></textarea></label><label class="block text-sm font-semibold">希望時期<input v-model="form.desiredDate" maxlength="40" placeholder="例：10月中旬" class="mt-2 min-h-11 w-full rounded-lg border px-3 font-normal"></label><p v-if="errorMessage" role="alert" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ errorMessage }}</p><button type="submit" class="min-h-11 rounded-lg bg-terracotta-600 px-5 text-sm font-semibold text-white disabled:opacity-50" :disabled="busy">{{ busy ? '送信中…' : '相談を送信する' }}</button></form></template></div></template>
