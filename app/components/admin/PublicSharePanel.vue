<script setup lang="ts">
const props = defineProps<{
  mapName: string
  mapSlug: string
  publicUrl: string
  isPublished: boolean
}>()

const qrDataUrl = ref('')
const qrError = ref('')
const copyStatus = ref('')
let isMounted = false

async function generateQrCode() {
  if (!isMounted || !props.publicUrl) return
  qrDataUrl.value = ''
  qrError.value = ''

  try {
    const { toDataURL } = await import('qrcode')
    qrDataUrl.value = await toDataURL(props.publicUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 640,
      color: {
        dark: '#1c1917',
        light: '#ffffff',
      },
    })
  }
  catch {
    qrError.value = 'QRコードを生成できませんでした。ページを再読み込みしてください。'
  }
}

async function copyPublicUrl() {
  copyStatus.value = ''
  try {
    await navigator.clipboard.writeText(props.publicUrl)
    copyStatus.value = '公開URLをコピーしました。'
  }
  catch {
    copyStatus.value = 'コピーできませんでした。URLを選択してコピーしてください。'
  }
}

onMounted(() => {
  isMounted = true
  void generateQrCode()
})

watch(() => props.publicUrl, () => {
  void generateQrCode()
})
</script>

<template>
  <section class="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
    <div>
      <h2 class="text-lg font-bold text-stone-900">公開URL・QRコード</h2>
      <p class="mt-2 text-sm leading-6 text-stone-600">現地の案内板やチラシでは、以下のURLまたはQRコードをご利用ください。</p>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
      <div class="min-w-0">
        <label for="public-map-url" class="text-sm font-semibold text-stone-800">公開URL</label>
        <div class="mt-2 flex flex-col gap-2 sm:flex-row">
          <input id="public-map-url" :value="publicUrl" readonly class="min-w-0 flex-1 rounded-lg border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm text-stone-700">
          <button type="button" class="shrink-0 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-100" @click="copyPublicUrl">URLをコピー</button>
        </div>
        <p v-if="copyStatus" role="status" class="mt-2 text-sm text-stone-600">{{ copyStatus }}</p>

        <div class="mt-5 flex flex-wrap gap-3">
          <a :href="publicUrl" target="_blank" rel="noopener" class="inline-flex rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-700">公開ページを開く</a>
          <a
            v-if="qrDataUrl"
            :href="qrDataUrl"
            :download="`${mapSlug}-qr.png`"
            class="rounded-lg bg-terracotta-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-terracotta-700"
          >QR画像をダウンロード</a>
          <span v-else class="rounded-lg bg-terracotta-600 px-4 py-2.5 text-sm font-semibold text-white opacity-50">QR画像をダウンロード</span>
        </div>

        <p v-if="!isPublished" class="mt-5 rounded-lg bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          現在は下書きです。このURLとQRコードは発行できますが、マップを公開するまで閲覧者には表示されません。
        </p>
      </div>

      <div class="rounded-2xl bg-stone-50 p-4 text-center">
        <div class="mx-auto grid aspect-square w-full max-w-64 place-items-center rounded-xl bg-white p-3 shadow-sm">
          <img v-if="qrDataUrl" :src="qrDataUrl" :alt="`${mapName}の公開URL QRコード`" class="h-full w-full object-contain">
          <span v-else-if="!qrError" class="text-sm text-stone-500">QRコードを生成しています…</span>
          <span v-else class="text-sm leading-6 text-red-700">{{ qrError }}</span>
        </div>
        <p class="mt-3 text-xs text-stone-500">PNG・640 × 640px</p>
      </div>
    </div>
  </section>
</template>
