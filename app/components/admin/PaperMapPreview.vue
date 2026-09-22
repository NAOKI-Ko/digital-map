<script setup lang="ts">
import type { PaperMapConfig, PaperSlotId } from '~~/shared/schemas/paper-map'
import type { PaperMapSource } from '~~/shared/types/paper-map'
import PaperMapLegacyPreview from './PaperMapLegacyPreview.vue'
export interface PaperPreviewResult { previewToken?: string, image: string | null, page: number, pageCount: number, selectedCount: number, clippedCount: number, warnings: string[], source: PaperMapSource }
const props = defineProps<{ mapId: string, config: PaperMapConfig, source: PaperMapSource, selectedSlot?: PaperSlotId | 'title' | null }>()
const emit = defineEmits<{ slotSelect: [slot: PaperSlotId | 'title'], resolved: [result: PaperPreviewResult], busy: [value: boolean] }>()
const result = ref<PaperPreviewResult | null>(null), pending = ref(false), message = ref(''), page = ref(0), zoom = ref(false)
let sequence = 0, timer: ReturnType<typeof setTimeout> | undefined
async function refresh() {
  const request = ++sequence
  if (props.config.templateVersion === 1) { pending.value = false; emit('busy', false); return }
  pending.value = true; emit('busy', true); message.value = ''
  try {
    const next = await $fetch<PaperPreviewResult>(`/api/maps/${props.mapId}/paper-maps/preview`, { method: 'POST', body: { config: props.config, page: page.value } })
    if (request !== sequence) return
    result.value = next; emit('resolved', next)
  }
  catch (error: any) { if (request === sequence) { result.value = null; message.value = error?.data?.statusMessage ?? '紙面を表示できませんでした。'; emit('resolved', { image: null, page: 0, pageCount: 0, selectedCount: 0, clippedCount: 0, warnings: [message.value], source: props.source }) } }
  finally { if (request === sequence) { pending.value = false; emit('busy', false) } }
}
watch(() => JSON.stringify(props.config), () => { page.value = 0; sequence++; clearTimeout(timer); pending.value = true; emit('busy', true); timer = setTimeout(refresh, 350) })
function changePage(next: number) { page.value = next; void refresh() }
onMounted(refresh)
onBeforeUnmount(() => { sequence++; clearTimeout(timer) })
</script>

<template>
  <PaperMapLegacyPreview v-if="config.templateVersion === 1" :config="config" :source="source" :selected-slot="selectedSlot" @slot-select="emit('slotSelect', $event)" />
  <section v-else aria-label="紙マップの印刷プレビュー" :aria-busy="pending" class="min-w-0 rounded-2xl border border-stone-200 bg-[#eae9e3] p-3 sm:p-5">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-stone-700">
      <span>{{ config.paper }}・{{ config.orientation === 'portrait' ? '縦' : '横' }} <template v-if="result">／ 全{{ result.pageCount }}ページ ／ {{ result.selectedCount }}スポット</template></span>
      <button type="button" class="min-h-11 rounded-lg bg-white px-3 text-xs font-semibold" :disabled="pending" @click="refresh">紙面を更新</button>
      <button type="button" class="min-h-11 rounded-lg bg-white px-3 font-semibold" :aria-pressed="zoom" @click="zoom = !zoom">{{ zoom ? '全体を見る' : '拡大して読む' }}</button>
    </div>
    <p v-if="pending" role="status" class="mb-3 text-sm text-stone-600">紙面を更新しています…</p>
    <p v-if="message" role="alert" class="rounded-lg bg-red-50 p-4 text-sm text-red-800">{{ message }}</p>
    <div v-if="result?.image" class="overflow-auto" :class="zoom ? 'max-h-[72vh]' : ''">
      <img :src="result.image" :alt="`${config.paperOriginal.title} ${result.page + 1}ページ目の印刷紙面`" class="mx-auto block bg-white shadow-lg" :class="[zoom ? 'w-[1000px] max-w-none' : 'max-h-[76vh] w-auto max-w-full', pending ? 'opacity-50' : '']">
    </div>
    <p v-else-if="!pending && !message" class="p-8 text-center text-sm text-stone-600">公開・配置済みのスポットを登録すると、ここに紙面が表示されます。</p>
    <nav v-if="result && result.pageCount > 1" class="mt-4 flex items-center justify-center gap-4" aria-label="紙面のページ">
      <button type="button" class="min-h-11 rounded-lg bg-white px-4 text-sm disabled:opacity-40" :disabled="pending || result.page === 0" @click="changePage(result.page - 1)">前のページ</button>
      <span class="text-sm">{{ result.page + 1 }} / {{ result.pageCount }}</span>
      <button type="button" class="min-h-11 rounded-lg bg-white px-4 text-sm disabled:opacity-40" :disabled="pending || result.page + 1 >= result.pageCount" @click="changePage(result.page + 1)">次のページ</button>
    </nav>
  </section>
</template>
