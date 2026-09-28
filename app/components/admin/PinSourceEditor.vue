<script setup lang="ts">
import type { AdminSpotSummary } from '~~/shared/types/spot'
import PinAppearancePreview from './PinAppearancePreview.vue'
import { standardPinAppearance, pinSourceLabel, type PinAppearance } from '~~/shared/utils/pin-appearance'
import UnsavedChangesGuard from './UnsavedChangesGuard.vue'
const props = defineProps<{ mapId: string, spot: AdminSpotSummary }>()
const emit = defineEmits<{ updated: [] }>()
const mode = ref(props.spot.pinSourceMode ?? 'individual')
const categoryId = ref(props.spot.pinSourceCategoryId ?? '')
const { data: categoryDefault, status: categoryStatus } = await useAsyncData(`pin-source-category-${props.spot.id}`, () => categoryId.value ? $fetch<{ design: PinAppearance | null, revision: number }>(`/api/maps/${props.mapId}/categories/${categoryId.value}/pin-default`) : Promise.resolve(null), { watch: [categoryId] })
const proposed = computed(() => mode.value === 'standard' ? standardPinAppearance : mode.value === 'category' ? (categoryDefault.value?.design ?? standardPinAppearance) : props.spot)
const saving = ref(false)
const message = ref('')
const dirty = computed(() => mode.value !== props.spot.pinSourceMode || categoryId.value !== (props.spot.pinSourceCategoryId ?? ''))
watch(() => props.spot, spot => { mode.value = spot.pinSourceMode ?? 'individual'; categoryId.value = spot.pinSourceCategoryId ?? '' })
watch(mode, value => { if (value === 'standard') categoryId.value = '' })
async function save() {
  saving.value = true; message.value = ''
  try {
    await $fetch(`/api/maps/${props.mapId}/spots/${props.spot.id}/pin-source`, { method: 'PATCH', body: { expectedVersion: props.spot.liveVersion, mode: mode.value, categoryId: categoryId.value || null, expectedCategoryRevision: mode.value === 'category' ? categoryDefault.value?.revision : undefined } })
    emit('updated'); message.value = 'PINの設定元を保存しました。公開中の表示は次の公開時に更新されます。'
  }
  catch (error: any) { message.value = error?.data?.statusMessage ?? '保存できませんでした。' }
  finally { saving.value = false }
}
</script>
<template>
  <section class="my-4 rounded-lg border border-stone-200 p-4">
    <h3 class="font-semibold">PINの設定元</h3>
    <p class="my-2 text-sm">現在：{{ pinSourceLabel(spot.pinSourceMode, spot.pinSourceCategoryName) }}</p>
    <label class="block text-sm">設定元<select v-model="mode" :disabled="saving" class="mt-1 block w-full rounded border p-2"><option value="standard">標準ピン</option><option value="category">カテゴリー既定</option><option value="individual">今の見た目を個別設定として保持</option></select></label>
    <label v-if="mode !== 'standard'" class="mt-3 block text-sm">{{ mode === 'category' ? 'PIN用カテゴリー' : '戻す先のカテゴリー（任意）' }}<select v-model="categoryId" :disabled="saving" class="mt-1 block w-full rounded border p-2"><option value="">未選択・解除</option><option v-for="category in spot.categories" :key="category.id" :value="category.id">{{ category.name }}</option></select></label>
    <p v-if="mode === 'category'" class="mt-2 text-xs text-stone-600">所属カテゴリーから明示的に選びます。既定未設定なら標準ピンを使い、今後の既定変更が編集中のピンに反映されます。</p>
    <div class="my-3 flex gap-3"><PinAppearancePreview :appearance="spot" label="現在" /><PinAppearancePreview :appearance="proposed" label="保存後" /></div>
    <button type="button" :disabled="saving || !dirty || (mode === 'category' && (!categoryId || categoryStatus !== 'success'))" class="mt-3 rounded bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50" @click="save">{{ saving ? '保存中…' : '設定元を保存' }}</button>
    <p v-if="message" role="status" class="mt-2 text-sm">{{ message }}</p>
    <UnsavedChangesGuard :dirty="dirty && !saving" />
  </section>
</template>
