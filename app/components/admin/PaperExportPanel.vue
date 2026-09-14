<script setup lang="ts">
const props = defineProps<{ mapId: string, floors: Array<{ id: string, name: string }>, isPublished: boolean }>()
const paper = ref<'A4' | 'A3'>('A4')
const orientation = ref<'portrait' | 'landscape'>('landscape')
const floorMode = ref<'selected' | 'all'>('selected')
const floorId = ref(props.floors[0]?.id ?? '')
const busy = ref(false)
const error = ref('')

async function download() {
  busy.value = true
  error.value = ''
  try {
    const blob = await $fetch<Blob>(`/api/maps/${props.mapId}/pdf`, { method: 'POST', body: { paper: paper.value, orientation: orientation.value, floorMode: floorMode.value, floorId: floorId.value }, responseType: 'blob' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `map-${paper.value}-${orientation.value}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }
  catch { error.value = 'PDFを生成できませんでした。設定とフロア画像を確認してください。' }
  finally { busy.value = false }
}
</script>

<template>
  <section class="border-t border-stone-200 pt-5">
    <h2 class="text-lg font-bold text-stone-900">紙マップPDF</h2>
    <p class="mt-2 text-sm leading-6 text-stone-600">公開中は現在の公開リリースを使用します。未公開時は「未公開プレビュー」と表示し、QRコードを掲載しません。</p>
    <div v-if="floors.length" class="mt-5 grid gap-4 sm:grid-cols-2">
      <label class="text-sm font-semibold">用紙<select v-model="paper" class="mt-1 w-full rounded-lg border p-2"><option>A4</option><option>A3</option></select></label>
      <label class="text-sm font-semibold">向き<select v-model="orientation" class="mt-1 w-full rounded-lg border p-2"><option value="landscape">横</option><option value="portrait">縦</option></select></label>
      <label class="text-sm font-semibold">フロア範囲<select v-model="floorMode" class="mt-1 w-full rounded-lg border p-2"><option value="selected">選択中のみ</option><option value="all">全フロア</option></select></label>
      <label class="text-sm font-semibold">フロア<select v-model="floorId" :disabled="floorMode === 'all'" class="mt-1 w-full rounded-lg border p-2 disabled:opacity-50"><option v-for="floor in floors" :key="floor.id" :value="floor.id">{{ floor.name }}</option></select></label>
    </div>
    <p v-else class="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">先にフロアを作成してください。</p>
    <p v-if="!isPublished" class="mt-4 text-sm font-semibold text-amber-800">未公開プレビューとして出力します。</p>
    <p v-if="error" role="alert" class="mt-4 text-sm text-red-700">{{ error }}</p>
    <button type="button" :disabled="busy || !floors.length" class="mt-5 rounded-lg bg-stone-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50" @click="download">{{ busy ? '生成中…' : 'PDFをダウンロード' }}</button>
  </section>
</template>
