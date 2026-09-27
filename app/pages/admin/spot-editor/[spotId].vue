<script setup lang="ts">
import SaveFeedback from '~/components/ui/SaveFeedback.vue'
import UnsavedChangesGuard from '~/components/admin/UnsavedChangesGuard.vue'
import type { SpotRevisionPayload } from '~~/shared/schemas/spot-revision'
import type { ImageUploadResponse } from '~~/shared/types/upload'

definePageMeta({ layout: 'admin', middleware: 'auth' })

type EditableTextKey = 'name' | 'description' | 'address' | 'phone' | 'website' | 'hoursText' | 'holidayText'
type EditorSpot = Pick<SpotRevisionPayload, EditableTextKey> & {
  fieldValues: SpotRevisionPayload['fieldValues']
  photos: Array<{ assetId: string }>
}
interface SpotEditorRevisionResponse {
  spot: EditorSpot
  revision: null | {
    payload: SpotRevisionPayload
    photos: Array<{ assetId: string }>
  }
  blockedByPreviousAssignee: boolean
}

const route = useRoute()
const spotId = String(route.params.spotId)
const { data, error: loadError, refresh } = await useFetch<SpotEditorRevisionResponse>(`/api/spot-editor/spots/${spotId}/revision`)
const editableFields: ReadonlyArray<{ key: EditableTextKey, multiline: boolean }> = [
  { key: 'name', multiline: false },
  { key: 'description', multiline: true },
  { key: 'address', multiline: false },
  { key: 'phone', multiline: false },
  { key: 'website', multiline: false },
  { key: 'hoursText', multiline: true },
  { key: 'holidayText', multiline: true },
]
const form = reactive<Record<EditableTextKey, string>>({
  name: '',
  description: '',
  address: '',
  phone: '',
  website: '',
  hoursText: '',
  holidayText: '',
})
const photoAssetIds = ref<string[]>([])
const operationError = ref('')
const uploadError = ref('')
const saveState = ref<'idle' | 'saving' | 'success' | 'error'>('idle')
const savedSnapshot = ref('')
const saving = ref(false)
const uploading = ref(false)
const { success } = useToast()
const isDirty = computed(() => Boolean(savedSnapshot.value) && JSON.stringify({ form, photoAssetIds: photoAssetIds.value }) !== savedSnapshot.value)

watch(() => data.value, (response) => {
  const source = response?.revision?.payload ?? response?.spot
  if (!source || isDirty.value) return
  for (const field of editableFields) form[field.key] = source[field.key] ?? ''
  photoAssetIds.value = response?.revision?.photos.map(photo => photo.assetId)
    ?? response?.spot.photos.map(photo => photo.assetId)
    ?? []
  savedSnapshot.value = JSON.stringify({ form, photoAssetIds: photoAssetIds.value })
}, { immediate: true })

async function save() {
  if (saving.value || uploading.value || !isDirty.value || data.value?.blockedByPreviousAssignee) return
  operationError.value = ''
  saveState.value = 'saving'
  saving.value = true
  try {
    await $fetch(`/api/spot-editor/spots/${spotId}/revision`, {
      method: 'PUT',
      body: {
        ...form,
        description: form.description || null,
        address: form.address || null,
        phone: form.phone || null,
        website: form.website || null,
        hoursText: form.hoursText || null,
        holidayText: form.holidayText || null,
        fieldValues: data.value?.spot.fieldValues.map(item => ({ fieldDefinitionId: item.fieldDefinitionId, valueJson: item.valueJson })) ?? [],
        photoAssetIds: photoAssetIds.value,
      },
    })
    savedSnapshot.value = JSON.stringify({ form, photoAssetIds: photoAssetIds.value })
    saveState.value = 'success'
    await refresh()
  }
  catch {
    operationError.value = '保存できませんでした。担当状況を確認して再度お試しください。'
    saveState.value = 'error'
  }
  finally {
    saving.value = false
  }
}

async function upload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || uploading.value) return
  const body = new FormData()
  body.append('file', file)
  uploading.value = true
  uploadError.value = ''
  operationError.value = ''
  try {
    const result = await $fetch<ImageUploadResponse>(`/api/spot-editor/spots/${spotId}/photos`, { method: 'POST', body })
    if (!photoAssetIds.value.includes(result.image.assetId)) photoAssetIds.value.push(result.image.assetId)
    success('写真をアップロードしました。変更申請へ反映するには保存してください。', `spot-photo-${spotId}`)
  }
  catch {
    uploadError.value = '写真をアップロードできませんでした。ファイルを確認して再度お試しください。'
  }
  finally {
    uploading.value = false
    input.value = ''
  }
}
</script>

<template>
  <section class="max-w-2xl">
    <NuxtLink to="/admin/spot-editor" class="text-sm underline">← 担当スポットへ</NuxtLink>
    <h1 class="mt-5 text-2xl font-bold">スポット情報の編集</h1>
    <p v-if="loadError" role="alert" class="mt-4 rounded bg-red-50 p-4 text-red-800">このスポットを編集する権限がないか、担当から外れています。</p>
    <template v-else>
      <p v-if="data?.blockedByPreviousAssignee" class="mt-4 rounded bg-amber-50 p-4">前の担当者による承認待ちの変更申請があるため、確認が完了するまで新しい編集は保存できません。</p>
      <SaveFeedback class="mt-4" :state="saveState" :message="operationError || (saveState === 'success' ? '承認待ちの変更を保存しました。' : '')" />
      <p v-if="uploadError" role="alert" class="mt-4 rounded bg-red-50 p-4 text-red-800">{{ uploadError }}</p>
      <form class="mt-6 space-y-4 rounded-xl bg-white p-6" @submit.prevent="save">
        <label v-for="field in editableFields" :key="field.key" class="block text-sm font-semibold">
          {{ field.key }}
          <textarea v-if="field.multiline" v-model="form[field.key]" class="mt-1 w-full rounded border px-3 py-2" />
          <input v-else v-model="form[field.key]" :type="field.key === 'website' ? 'url' : 'text'" :required="field.key === 'name'" class="mt-1 w-full rounded border px-3 py-2">
        </label>
        <div>
          <label class="text-sm font-semibold">
            新しい写真
            <input type="file" accept="image/png,image/jpeg" :disabled="uploading" class="mt-2 block" @change="upload">
          </label>
          <p class="mt-2 text-xs">選択中: {{ photoAssetIds.length }}件（Tenant Media Libraryの閲覧はできません）</p>
        </div>
        <button :disabled="data?.blockedByPreviousAssignee || saving || uploading || !isDirty" class="rounded bg-stone-900 px-4 py-3 font-semibold text-white disabled:opacity-40">{{ saving ? '保存中…' : '承認待ちとして保存' }}</button>
      </form>
      <UnsavedChangesGuard :dirty="isDirty && !saving" />
    </template>
  </section>
</template>
