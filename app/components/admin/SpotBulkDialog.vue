<script setup lang="ts">
import AppDialog from '~/components/ui/AppDialog.vue'
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue'
import UnsavedChangesGuard from './UnsavedChangesGuard.vue'
import PinAppearancePreview from './PinAppearancePreview.vue'
import type { AdminSpotSummary, AdminSpotListResponse } from '~~/shared/types/spot'
import type { SpotBulkInput } from '~~/shared/schemas/spot-bulk'
import type { PinAppearance } from '~~/shared/utils/pin-appearance'
interface Review { reviewToken: string, total: number, changed: number, unchanged: number, rows: Array<{ id: string, name: string, floorName: string, version: number, error: string | null, description: string, changed: boolean, before: PinAppearance, after: PinAppearance }> }
const props = defineProps<{ mapId: string, spots: AdminSpotSummary[], filters: AdminSpotListResponse['filters'] }>()
const emit = defineEmits<{ close: [], saved: [message: string] }>()
const action = ref('')
const categoryId = ref('')
const floorId = ref('')
const mode = ref('')
const review = ref<Review | null>(null)
const loading = ref(false)
const saving = ref(false)
const message = ref('')
const discard = ref(false)
const needsRefresh = ref(false)
let requestNumber = 0
const command = computed<SpotBulkInput | null>(() => {
  const spotIds = props.spots.map(spot => spot.id)
  if (action.value === 'publish' || action.value === 'unpublish' || action.value === 'delete') return { action: action.value, spotIds }
  if ((action.value === 'addCategory' || action.value === 'removeCategory') && categoryId.value) return { action: action.value, categoryId: categoryId.value, spotIds }
  if (action.value === 'assignFloor' && floorId.value) return { action: 'assignFloor', floorId: floorId.value, spotIds }
  if (action.value === 'pinSource' && ['standard', 'individual', 'category', 'soleCategory'].includes(mode.value) && (mode.value !== 'category' || categoryId.value)) return { action: 'pinSource', mode: mode.value as 'standard' | 'individual' | 'category' | 'soleCategory', ...(mode.value === 'category' ? { categoryId: categoryId.value } : {}), spotIds }
  return null
})
watch(command, () => { void loadReview() })
async function loadReview() {
  const sequence = ++requestNumber
  review.value = null; message.value = ''; needsRefresh.value = false
  if (!command.value) return
  loading.value = true
  try {
    const result = await $fetch<Review>(`/api/maps/${props.mapId}/spots/bulk-preview`, { method: 'POST', body: command.value })
    if (sequence === requestNumber) review.value = result
  }
  catch (error: any) { if (sequence === requestNumber) message.value = error?.data?.statusMessage ?? '変更内容を読み込めませんでした。' }
  finally { if (sequence === requestNumber) loading.value = false }
}
async function apply() {
  if (!command.value || !review.value || saving.value) return
  saving.value = true; message.value = ''
  try {
    const result = await $fetch<{ updatedCount: number, unchangedCount: number }>(`/api/maps/${props.mapId}/spots/bulk`, { method: 'PATCH', body: { ...command.value, reviewToken: review.value.reviewToken } })
    emit('saved', `${result.updatedCount}件を変更しました。変更不要 ${result.unchangedCount}件。`)
  }
  catch (error: any) { message.value = error?.data?.statusMessage ?? '結果を確認できませんでした。再読込で現在の状態を確認してください。'; needsRefresh.value = true }
  finally { saving.value = false }
}
function close() { if (!saving.value) { if (action.value) discard.value = true; else emit('close') } }
</script>
<template>
  <AppDialog open title="選択したスポットの一括操作" :description="`${spots.length}件を選択中。変更する操作を選び、内容を確認して適用します。`" max-width="lg" @close="close">
    <fieldset :disabled="saving" class="space-y-3">
      <label class="block text-sm">操作<select v-model="action" class="mt-1 block w-full rounded border p-2"><option value="">変更しない</option><option value="addCategory">カテゴリーを追加</option><option value="removeCategory">カテゴリーを外す</option><option value="assignFloor">未配置スポットの配置先フロアを変更</option><option value="pinSource">PINの設定元を変更</option><option value="publish">公開対象にする</option><option value="unpublish">公開対象外にする</option><option value="delete">スポットを削除</option></select></label>
      <label v-if="action === 'pinSource'" class="block text-sm">PINの設定元<select v-model="mode" class="mt-1 block w-full rounded border p-2"><option value="">変更しない</option><option value="soleCategory">各スポットの1つだけのカテゴリーを使う</option><option value="category">指定したカテゴリーを使う</option><option value="standard">標準ピンを使う</option><option value="individual">今の見た目を個別設定として保持（戻す先を解除）</option></select></label>
      <label v-if="action === 'addCategory' || action === 'removeCategory' || (action === 'pinSource' && mode === 'category')" class="block text-sm">カテゴリー<select v-model="categoryId" class="mt-1 block w-full rounded border p-2"><option value="">変更しない</option><option v-for="category in filters.categories" :key="category.id" :value="category.id">{{ category.name }}</option></select></label>
      <label v-if="action === 'assignFloor'" class="block text-sm">配置先フロア<select v-model="floorId" class="mt-1 block w-full rounded border p-2"><option value="">変更しない</option><option v-for="floor in filters.floors" :key="floor.id" :value="floor.id">{{ floor.name }}</option></select></label>
    </fieldset>
    <p class="my-3 text-sm text-stone-600">公開対象・PINの変更だけでは公開中の内容は変わりません。閲覧者プレビューで確認してから、マップを公開してください。</p>
    <p v-if="action === 'delete'" class="my-3 font-semibold text-red-700">削除は元に戻せません。対象名を確認してください。</p>
    <p v-if="action === 'pinSource'" class="my-3 text-sm">個別設定を変更する場合も含みます。カテゴリー既定は今後の変更を継承します。個別設定に戻しても以前の上書きデザインは復元されません。</p>
    <p v-if="loading" role="status">確認内容を読み込んでいます…</p>
    <template v-if="review">
      <p class="font-semibold">対象 {{ review.total }}件 · 変更 {{ review.changed }}件 · 変更不要 {{ review.unchanged }}件</p>
      <p class="mt-1 text-sm">適用可能 {{ review.rows.filter(row => !row.error).length }}件 · 要解消 {{ review.rows.filter(row => row.error).length }}件 · 自動除外 0件</p>
      <p v-if="review.rows.some(row => row.error)" role="alert" class="mt-2 text-red-700">全{{ review.total }}件とも未適用です。要解消のスポットを確認し、選択を見直してください。自動的な除外は行いません。</p>
      <ul class="my-3 max-h-80 overflow-y-auto divide-y rounded border p-3 text-sm">
        <li v-for="row in review.rows" :key="row.id" class="py-3"><strong>{{ row.name }}</strong> · {{ row.floorName }}<p>{{ row.description }}</p><p v-if="row.error" class="text-red-700">{{ row.error }}</p><div v-if="action === 'pinSource'" class="mt-2 flex gap-2"><PinAppearancePreview :appearance="row.before" label="現在" /><PinAppearancePreview :appearance="row.after" label="適用後" /></div></li>
      </ul>
    </template>
    <p v-if="message" role="alert" class="my-3 text-red-700">{{ message }}</p>
    <button v-if="needsRefresh || (!loading && command && !review)" type="button" class="my-2 underline" @click="loadReview">最新状態を読み込み、再確認</button>
    <div class="mt-4 flex justify-end gap-3"><button type="button" :disabled="saving" class="rounded border px-4 py-2" @click="close">キャンセル</button><button type="button" :disabled="saving || loading || !review || needsRefresh || review.rows.some(row => row.error)" class="rounded bg-stone-900 px-4 py-2 text-white disabled:opacity-50" @click="apply">{{ saving ? '適用中…' : `この${spots.length}件に適用` }}</button></div>
  </AppDialog>
  <ConfirmDialog :open="discard" title="一括操作を中止" message="確認中の操作を破棄します。スポットは変更されません。" confirm-label="破棄する" @cancel="discard = false" @confirm="emit('close')" />
  <UnsavedChangesGuard :dirty="Boolean(action) && !saving" />
</template>
