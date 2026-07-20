<script setup lang="ts">
import type { ImageUploadResponse, UploadedImage } from '~~/shared/types/upload'

const props = withDefaults(defineProps<{
  label?: string
}>(), {
  label: 'イラスト画像',
})

const emit = defineEmits<{
  uploaded: [image: UploadedImage]
}>()

const input = useTemplateRef<HTMLInputElement>('input')
const isUploading = ref(false)
const errorMessage = ref('')
const uploadedImage = ref<UploadedImage>()

function chooseFile() {
  input.value?.click()
}

async function upload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) {
    return
  }

  if (!['image/png', 'image/jpeg'].includes(file.type)) {
    errorMessage.value = 'PNGまたはJPEG画像を選択してください。'
    target.value = ''
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    errorMessage.value = '画像は10MB以下にしてください。'
    target.value = ''
    return
  }

  isUploading.value = true
  errorMessage.value = ''

  try {
    const body = new FormData()
    body.append('file', file)
    const response = await $fetch<ImageUploadResponse>('/api/uploads/image', {
      method: 'POST',
      body,
    })
    uploadedImage.value = response.image
    emit('uploaded', response.image)
  }
  catch (error) {
    errorMessage.value = getErrorMessage(error)
  }
  finally {
    isUploading.value = false
    target.value = ''
  }
}

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'data' in error) {
    const data = error.data as { statusMessage?: string }
    if (data.statusMessage) {
      return data.statusMessage
    }
  }

  return '画像をアップロードできませんでした。もう一度お試しください。'
}
</script>

<template>
  <div>
    <input
      ref="input"
      type="file"
      accept="image/png,image/jpeg,.png,.jpg,.jpeg"
      class="sr-only"
      @change="upload"
    >
    <div
      class="rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 p-6 text-center"
      :aria-busy="isUploading"
    >
      <p class="font-semibold text-stone-900">
        {{ label }}を選択
      </p>
      <p class="mt-1 text-sm text-stone-500">
        PNG / JPEG、10MBまで
      </p>
      <button
        type="button"
        :disabled="isUploading"
        class="mt-4 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
        @click="chooseFile"
      >
        {{ isUploading ? 'アップロード中…' : 'ファイルを選ぶ' }}
      </button>
    </div>

    <p v-if="errorMessage" role="alert" class="mt-3 text-sm text-red-600">
      {{ errorMessage }}
    </p>

    <div v-if="uploadedImage" role="status" class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <p class="text-sm font-semibold text-emerald-800">
        画像をアップロードしました。
      </p>
      <img
        :src="uploadedImage.url"
        :alt="`${props.label}のプレビュー`"
        class="mt-3 max-h-72 w-full rounded-lg bg-white object-contain"
      >
    </div>
  </div>
</template>
