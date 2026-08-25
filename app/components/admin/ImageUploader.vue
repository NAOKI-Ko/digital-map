<script setup lang="ts">
import type { ImageUploadResponse, UploadedImage } from '~~/shared/types/upload'

const props = withDefaults(defineProps<{
  label?: string
  confirmMessage?: string
  uploadUrl?: string
}>(), {
  label: 'イラスト画像',
  confirmMessage: '',
  uploadUrl: '/api/uploads/image',
})

const emit = defineEmits<{
  uploaded: [image: UploadedImage]
}>()

const input = useTemplateRef<HTMLInputElement>('input')
const isUploading = ref(false)
const errorMessage = ref('')
const uploadedImage = ref<UploadedImage>()
const selectedFile = ref<File>()
const previewUrl = ref('')

function clearSelection() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  selectedFile.value = undefined
  if (input.value) input.value.value = ''
}

onBeforeUnmount(clearSelection)

function chooseFile() {
  input.value?.click()
}

function selectFile(event: Event) {
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

  errorMessage.value = ''
  clearSelection()
  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
}

async function confirmUpload() {
  const file = selectedFile.value
  if (!file) return
  if (props.confirmMessage && !window.confirm(props.confirmMessage)) return
  isUploading.value = true
  try {
    const body = new FormData()
    body.append('file', file)
    const response = await $fetch<ImageUploadResponse>(props.uploadUrl, {
      method: 'POST',
      body,
    })
    uploadedImage.value = response.image
    emit('uploaded', response.image)
    clearSelection()
  }
  catch (error) {
    errorMessage.value = getErrorMessage(error)
  }
  finally {
    isUploading.value = false
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
      @change="selectFile"
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
        {{ selectedFile ? '別のファイルを選ぶ' : 'ファイルを選ぶ' }}
      </button>
    </div>

    <div v-if="selectedFile" class="mt-4 rounded-xl border border-stone-200 bg-white p-4">
      <p class="break-all text-sm font-semibold text-stone-800">{{ selectedFile.name }}</p>
      <img :src="previewUrl" :alt="`${props.label}の選択プレビュー`" class="mt-3 max-h-72 w-full rounded-lg bg-stone-50 object-contain">
      <div class="mt-3 flex gap-2">
        <button type="button" :disabled="isUploading" class="rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" @click="confirmUpload">{{ isUploading ? 'アップロード中…' : 'この画像を使用' }}</button>
        <button type="button" :disabled="isUploading" class="rounded-lg border border-stone-300 px-4 py-2 text-sm" @click="clearSelection">キャンセル</button>
      </div>
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
