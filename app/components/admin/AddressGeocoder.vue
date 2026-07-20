<script setup lang="ts">
import type { GeocodeResponse, GeocodeResult } from '~~/shared/types/geocode'

const emit = defineEmits<{
  select: [result: GeocodeResult]
}>()

const address = ref('')
const results = ref<GeocodeResult[]>([])
const isSearching = ref(false)
const errorMessage = ref('')
const selectedId = ref('')

async function search() {
  const query = address.value.trim()
  if (query.length < 2) {
    errorMessage.value = '住所を2文字以上入力してください。'
    return
  }

  isSearching.value = true
  errorMessage.value = ''
  selectedId.value = ''
  try {
    const response = await $fetch<GeocodeResponse>('/api/geocode', { query: { q: query } })
    results.value = response.results
    if (response.results.length === 0) {
      errorMessage.value = '該当する場所が見つかりませんでした。住所を詳しく入力してください。'
    }
  }
  catch (error) {
    errorMessage.value = getErrorMessage(error)
  }
  finally {
    isSearching.value = false
  }
}

function selectResult(result: GeocodeResult) {
  selectedId.value = result.id
  emit('select', result)
}

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'data' in error) {
    const data = error.data as { statusMessage?: string }
    if (data.statusMessage) return data.statusMessage
  }
  return '住所を検索できませんでした。もう一度お試しください。'
}
</script>

<template>
  <div class="rounded-xl border border-stone-200 bg-stone-50 p-4 sm:p-5">
    <label for="spot-address" class="text-sm font-semibold text-stone-800">住所から位置を検索</label>
    <p class="mt-1 text-xs leading-5 text-stone-500">番地や施設名まで含めると、候補を絞り込みやすくなります。</p>
    <form class="mt-3 flex flex-col gap-2 sm:flex-row" @submit.prevent="search">
      <input id="spot-address" v-model="address" type="search" maxlength="200" autocomplete="street-address" class="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm" placeholder="例：東京都千代田区丸の内1丁目 東京駅">
      <button type="submit" :disabled="isSearching" class="rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{{ isSearching ? '検索中…' : '住所を検索' }}</button>
    </form>

    <p v-if="errorMessage" role="alert" class="mt-3 text-sm text-red-600">{{ errorMessage }}</p>
    <ul v-if="results.length" class="mt-4 space-y-2">
      <li v-for="result in results" :key="result.id">
        <button type="button" class="w-full rounded-lg border bg-white p-3 text-left text-sm transition hover:border-terracotta-400 hover:bg-terracotta-50" :class="selectedId === result.id ? 'border-terracotta-500 ring-2 ring-terracotta-100' : 'border-stone-200'" @click="selectResult(result)">
          <span class="block leading-5 text-stone-800">{{ result.displayName }}</span>
          <span class="mt-1 block font-mono text-xs text-stone-500">lat {{ result.lat.toFixed(6) }}, lng {{ result.lng.toFixed(6) }}</span>
        </button>
      </li>
    </ul>
    <p class="mt-4 text-xs text-stone-500">検索結果: © OpenStreetMap contributors / Nominatim。公開サービスの利用上限により連続検索は制限されます。</p>
  </div>
</template>
