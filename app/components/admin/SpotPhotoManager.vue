<script setup lang="ts">
import type { ImageUploadResponse } from '~~/shared/types/upload'
import type { SpotPhotosResponse } from '~~/shared/types/spot'

const props = defineProps<{
  mapId: string
  spotId: string
  initialPhotos: string[]
}>()

const emit = defineEmits<{
  updated: [photos: string[]]
}>()

const input = useTemplateRef<HTMLInputElement>('input')
const photos = ref([...props.initialPhotos])
const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

watch(() => props.initialPhotos, value => photos.value = [...value], { deep: true })

function chooseFiles() {
  input.value?.click()
}

async function addPhotos(event: Event) {
  const target = event.target as HTMLInputElement
  const files = [...(target.files ?? [])]
  target.value = ''
  if (files.length === 0) return

  const remaining = 6 - photos.value.length
  if (remaining <= 0 || files.length > remaining) {
    errorMessage.value = `写真は6枚までです。あと${Math.max(remaining, 0)}枚追加できます。`
    return
  }

  const invalidFile = files.find(file => !['image/png', 'image/jpeg'].includes(file.type) || file.size > 10 * 1024 * 1024)
  if (invalidFile) {
    errorMessage.value = 'PNGまたはJPEGの10MB以下の写真を選択してください。'
    return
  }

  isSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const uploadedUrls: string[] = []
    for (const file of files) {
      const body = new FormData()
      body.append('file', file)
      const response = await $fetch<ImageUploadResponse>('/api/uploads/image', { method: 'POST', body })
      uploadedUrls.push(response.image.url)
    }
    await persist([...photos.value, ...uploadedUrls])
    successMessage.value = `${uploadedUrls.length}枚の写真を追加しました。`
  }
  catch {
    errorMessage.value = '写真を保存できませんでした。もう一度お試しください。'
  }
  finally {
    isSaving.value = false
  }
}

async function removePhoto(index: number) {
  if (!window.confirm('この写真を登録から外しますか？')) return
  await saveChange(photos.value.filter((_, photoIndex) => photoIndex !== index), '写真を削除しました。')
}

async function movePhoto(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= photos.value.length) return
  const reordered = [...photos.value]
  const [moved] = reordered.splice(index, 1)
  if (!moved) return
  reordered.splice(target, 0, moved)
  await saveChange(reordered, '写真の表示順を保存しました。')
}

async function saveChange(nextPhotos: string[], message: string) {
  isSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await persist(nextPhotos)
    successMessage.value = message
  }
  catch {
    errorMessage.value = '写真を保存できませんでした。もう一度お試しください。'
  }
  finally {
    isSaving.value = false
  }
}

async function persist(nextPhotos: string[]) {
  const response = await $fetch<SpotPhotosResponse>(`/api/maps/${props.mapId}/spots/${props.spotId}/photos`, {
    method: 'PATCH',
    body: { photos: nextPhotos },
  })
  photos.value = response.photos
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
      <div>
        <input ref="input" type="file" multiple accept="image/png,image/jpeg,.png,.jpg,.jpeg" class="sr-only" @change="addPhotos">
        <button type="button" :disabled="isSaving || photos.length >= 6" class="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" @click="chooseFiles">
          {{ isSaving ? '保存中…' : '写真を追加' }}
        </button>
      </div>
    </div>

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
  </div>
</template>
