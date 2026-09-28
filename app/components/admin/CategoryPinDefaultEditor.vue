<script setup lang="ts">
import PinAppearancePreview from './PinAppearancePreview.vue'
import PinDesignEditor from './PinDesignEditor.vue'
import UnsavedChangesGuard from './UnsavedChangesGuard.vue'
import { standardPinAppearance, type PinAppearance } from '~~/shared/utils/pin-appearance'
const props = defineProps<{ mapId: string, categoryId: string }>()
const { data, error, refresh } = await useFetch(`/api/maps/${props.mapId}/categories/${props.categoryId}/pin-default`)
const draft = ref<PinAppearance>({ ...standardPinAppearance })
const enabled = ref(false)
const saving = ref(false)
const message = ref('')
watch(data, value => { enabled.value = Boolean(value?.design); draft.value = { ...(value?.design ?? standardPinAppearance) } }, { immediate: true })
const dirty = computed(() => enabled.value !== Boolean(data.value?.design) || (enabled.value && JSON.stringify(draft.value) !== JSON.stringify(data.value?.design ?? standardPinAppearance)))
async function save() {
  if (!data.value || saving.value) return
  saving.value = true; message.value = ''
  try {
    await $fetch(`/api/maps/${props.mapId}/categories/${props.categoryId}/pin-default`, { method: 'PATCH', body: { expectedRevision: data.value.revision, dependentsVersion: data.value.dependentsVersion, design: enabled.value ? draft.value : null } })
    await refresh(); message.value = '既定デザインを保存しました。'
  }
  catch (error: any) { message.value = error?.data?.statusMessage ?? '保存できませんでした。' }
  finally { saving.value = false }
}
function updateDraft(value: PinAppearance) {
  const { pinIconType, pinIconId, pinIconImageUrl, pinIconAssetId, pinColor, pinSize } = value
  draft.value = { pinIconType, pinIconId, pinIconImageUrl, pinIconAssetId: pinIconAssetId ?? null, pinColor, pinSize }
}
</script>
<template>
  <section class="mt-3 rounded-lg border border-stone-200 p-4">
    <h3 class="font-semibold">このカテゴリーを使うピンの既定デザイン</h3>
    <p v-if="error" role="alert">既定デザインを読み込めませんでした。</p>
    <template v-if="data">
      <p class="my-2 text-sm">変更対象：{{ data.spots.length }}件。標準ピン・個別設定には影響しません。公開中の表示は次の公開時に更新されます。</p>
      <NuxtLink v-if="data.spots.length" :to="{ path: `/admin/maps/${mapId}/spots`, query: { pinSource: 'category', pinSourceCategoryId: categoryId } }" class="text-sm underline">この既定を使うスポットを一覧で確認</NuxtLink>
      <details v-if="data.spots.length" class="my-3 text-sm"><summary>対象スポットとフロアを確認</summary><ul><li v-for="spot in data.spots" :key="spot.id">{{ spot.floor.name }} — {{ spot.name }}</li></ul></details>
      <div class="my-3 flex gap-3"><PinAppearancePreview :appearance="data.design ?? standardPinAppearance" label="現在" /><PinAppearancePreview :appearance="enabled ? draft : standardPinAppearance" label="保存後" /></div>
      <label class="block text-sm"><input v-model="enabled" type="checkbox" :disabled="saving"> PIN既定を設定する（解除すると継承中のピンは標準ピンになります）</label>
      <PinDesignEditor v-if="enabled" :key="data.revision" :map-id="mapId" spot-id="" :initial-value="data.design ?? standardPinAppearance" :show-save="false" :show-importance="false" :guard-navigation="false" @changed="updateDraft" />
      <button type="button" :disabled="saving || !dirty" class="mt-4 rounded bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50" @click="save">{{ saving ? '保存中…' : `確認した${data.spots.length}件の既定を保存` }}</button>
      <p v-if="message" role="status" class="mt-2 text-sm">{{ message }}</p>
    </template>
    <UnsavedChangesGuard :dirty="dirty && !saving" />
  </section>
</template>
