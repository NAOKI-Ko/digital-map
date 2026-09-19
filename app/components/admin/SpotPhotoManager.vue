<script setup lang="ts">
import MediaPicker from '~/components/admin/MediaPicker.vue'
import type { UploadedImage } from '~~/shared/types/upload'
import type { SpotPhotosResponse } from '~~/shared/types/spot'
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue'

const props = defineProps<{
  mapId: string
  spotId: string
  initialPhotos: string[]
  initialPhotoAssetIds?: Array<string | null>
}>()

const emit = defineEmits<{
  updated: [photos: string[]]
}>()

const photos = ref([...props.initialPhotos])
const assetIds = ref([...(props.initialPhotoAssetIds ?? props.initialPhotos.map(() => null))])
const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const removeTargetIndex = ref<number | null>(null)

watch(() => props.initialPhotos, (value) => {
  photos.value = [...value]
  assetIds.value = [...(props.initialPhotoAssetIds ?? value.map(() => null))]
}, { deep: true })

async function addPhoto(image: UploadedImage) {
  if (photos.value.length >= 6) {
    errorMessage.value = '写真は6枚までです。'
    return
  }
  await saveChange(
    [...photos.value, image.url],
    [...assetIds.value, image.assetId],
    '写真を追加しました。',
  )
}

async function removePhoto(index: number) {
  removeTargetIndex.value = index
}

async function confirmRemovePhoto() {
  const index = removeTargetIndex.value
  if (index === null) return
  removeTargetIndex.value = null
  await saveChange(photos.value.filter((_, photoIndex) => photoIndex !== index), assetIds.value.filter((_, photoIndex) => photoIndex !== index), '写真を削除しました。')
}

async function movePhoto(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= photos.value.length) return
  const reordered = [...photos.value]
  const [moved] = reordered.splice(index, 1)
  if (!moved) return
  reordered.splice(target, 0, moved)
  const reorderedAssetIds = [...assetIds.value]
  const [movedAssetId] = reorderedAssetIds.splice(index, 1)
  reorderedAssetIds.splice(target, 0, movedAssetId ?? null)
  await saveChange(reordered, reorderedAssetIds, '写真の表示順を保存しました。')
}

async function saveChange(nextPhotos: string[], nextAssetIds: Array<string | null>, message: string) {
  isSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await persist(nextPhotos, nextAssetIds)
    successMessage.value = message
  }
  catch {
    errorMessage.value = '写真を保存できませんでした。もう一度お試しください。'
  }
  finally {
    isSaving.value = false
  }
}

async function persist(nextPhotos: string[], nextAssetIds: Array<string | null>) {
  const response = await $fetch<SpotPhotosResponse>(`/api/maps/${props.mapId}/spots/${props.spotId}/photos`, {
    method: 'PATCH',
    body: { photos: nextPhotos, assetIds: nextAssetIds },
  })
  photos.value = response.photos
  assetIds.value = response.assetIds
  emit('updated', response.photos)
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-lg font-bold text-stone-900">写真</h2>
        <p class="mt-1 text-sm text-stone-600">PNG / JPEG、1枚10MBまで、最大6枚。最初の写真を代表画像として扱います。</p>
      </div>
    </div>
    <MediaPicker v-if="photos.length < 6" :map-id="mapId" label="スポット写真" usage="photo" class="mt-5" @selected="addPhoto" />

    <p v-if="errorMessage" role="alert" class="mt-4 text-sm text-red-600">{{ errorMessage }}</p>
    <p v-if="successMessage" role="status" class="mt-4 text-sm text-emerald-700">{{ successMessage }}</p>

    <div v-if="photos.length === 0" class="mt-5 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 p-8 text-center text-sm text-stone-600">まだ写真はありません。</div>
    <ol v-else class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="(photo, index) in photos" :key="photo" class="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <div class="relative">
          <img :src="photo" :alt="`登録写真 ${index + 1}`" class="h-44 w-full bg-stone-100 object-cover">
          <span v-if="index === 0" class="absolute left-2 top-2 rounded-full bg-stone-900/85 px-2.5 py-1 text-xs font-semibold text-white">代表写真</span>
        </div>
        <div class="flex items-center justify-between gap-2 p-3">
          <div class="flex gap-1">
            <button type="button" :disabled="isSaving || index === 0" :aria-label="`写真${index + 1}を前へ`" class="rounded border border-stone-300 px-2.5 py-1 text-sm disabled:opacity-40" @click="movePhoto(index, -1)">←</button>
            <button type="button" :disabled="isSaving || index === photos.length - 1" :aria-label="`写真${index + 1}を後へ`" class="rounded border border-stone-300 px-2.5 py-1 text-sm disabled:opacity-40" @click="movePhoto(index, 1)">→</button>
          </div>
          <button type="button" :disabled="isSaving" class="rounded px-2.5 py-1 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40" @click="removePhoto(index)">削除</button>
        </div>
      </li>
    </ol>
    <ConfirmDialog :open="removeTargetIndex !== null" title="写真を削除" message="この写真をスポットの登録から外します。元の画像ファイル自体は削除されません。" confirm-label="登録から外す" destructive :busy="isSaving" @cancel="removeTargetIndex = null" @confirm="confirmRemovePhoto" />
  </div>
</template>
