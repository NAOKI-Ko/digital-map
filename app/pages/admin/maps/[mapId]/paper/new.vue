<script setup lang="ts">
import type { PaperMapPurpose } from '~~/shared/schemas/paper-map'
import type { PaperMapResponse } from '~~/shared/types/paper-map'

definePageMeta({ layout: 'admin', middleware: 'auth' })
const route = useRoute(), router = useRouter()
const mapId = route.params.mapId as string
const busy = ref<PaperMapPurpose | null>(null)
const errorMessage = ref('')
const choices: Array<{ value: PaperMapPurpose, title: string, description: string, badge: string }> = [
  { value: 'MAP_FOCUS', title: '地図を大きく見せる', description: '回遊や場所の把握を優先。初めてならこちらがおすすめです。', badge: 'おすすめ' },
  { value: 'GUIDE', title: '地図と案内をバランスよく', description: 'スポット名や説明も一緒に掲載します。', badge: '案内向け' },
  { value: 'PHOTO_GUIDE', title: '写真付きで紹介する', description: '観光案内や見どころ紹介に向いた構成です。', badge: '写真重視' },
]
async function create(purpose: PaperMapPurpose) {
  busy.value = purpose; errorMessage.value = ''
  try {
    const response = await $fetch<PaperMapResponse>(`/api/maps/${mapId}/paper-maps`, { method: 'POST', body: { purpose } })
    await router.push(`/admin/maps/${mapId}/paper/${response.paperMap.id}`)
  }
  catch { errorMessage.value = '紙マップを作成できませんでした。公開できるスポットを確認してください。' }
  finally { busy.value = null }
}
</script>

<template><div class="max-w-5xl"><NuxtLink :to="`/admin/maps/${mapId}/paper`" class="text-sm font-semibold text-stone-600">← 紙マップ一覧</NuxtLink><header class="mt-6"><p class="text-sm font-medium text-terracotta-700">1つ選ぶだけ</p><h1 class="mt-1 text-3xl font-bold">何を一番見せたいですか？</h1><p class="mt-2 text-sm text-stone-600">選んだ用途に合わせて、用紙・向き・情報量を自動設定します。あとから選択式で変更できます。</p></header><div class="mt-8 grid gap-5 md:grid-cols-3"><button v-for="choice in choices" :key="choice.value" type="button" class="min-h-56 rounded-2xl border border-stone-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-terracotta-400 hover:shadow-md disabled:opacity-60" :disabled="Boolean(busy)" @click="create(choice.value)"><span class="rounded-full bg-terracotta-50 px-3 py-1 text-xs font-bold text-terracotta-700">{{ choice.badge }}</span><h2 class="mt-5 text-xl font-bold">{{ choice.title }}</h2><p class="mt-3 text-sm leading-6 text-stone-600">{{ choice.description }}</p><span class="mt-6 block text-sm font-bold text-terracotta-700">{{ busy === choice.value ? '作成中…' : 'この用途で作る →' }}</span></button></div><p v-if="errorMessage" role="alert" class="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">{{ errorMessage }}</p></div></template>
