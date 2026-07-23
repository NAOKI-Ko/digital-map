<script setup lang="ts">
import ImageUploader from '~/components/admin/ImageUploader.vue'
import { getPinIconPreset, normalizePinIconId, pinIconPresets, type PinIconType } from '~~/shared/constants/spot'
import { pinDesignSchema, type PinDesignInput } from '~~/shared/schemas/pin-design'
import type { SpotPinDesignResponse } from '~~/shared/types/spot'
import { getPinColorVariants } from '~~/shared/utils/pin-style'

const props = defineProps<{
  mapId: string
  spotId: string
  category: string
  initialValue: {
    pinIconType: PinIconType
    pinIconId: string | null
    pinIconImageUrl: string | null
    pinColor: string
  }
}>()

const emit = defineEmits<{
  updated: [design: SpotPinDesignResponse['design']]
}>()

const design = reactive<PinDesignInput>({
  ...props.initialValue,
  pinIconId: normalizePinIconId(props.initialValue.pinIconId, props.category),
})
const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const colorPresets = ['#C7401F', '#2563EB', '#047857', '#7C3AED', '#D97706', '#292524']
const pinTypeOptions: Array<{ value: PinIconType, label: string, description: string }> = [
  { value: 'preset', label: 'プリセット', description: '用意された記号をピンの中に表示' },
  { value: 'custom', label: 'カスタムアイコン', description: 'ロゴや写真をピンの中に表示' },
  { value: 'illustration', label: 'イラスト直置き', description: '画像を台座なしで地図へ配置' },
]
const selectedPreset = computed(() => getPinIconPreset(design.pinIconId))
const usesUploadedImage = computed(() => design.pinIconType === 'custom' || design.pinIconType === 'illustration')
const uploadHeading = computed(() => design.pinIconType === 'illustration' ? '直置きイラスト' : 'カスタム画像')
const uploadLabel = computed(() => design.pinIconType === 'illustration' ? '直置きイラスト画像' : 'カスタムピン画像')
const previewStyle = computed(() => {
  const colors = getPinColorVariants(design.pinColor)
  return {
    '--pin-color': colors.base,
    '--pin-color-light': colors.light,
    '--pin-color-dark': colors.dark,
  }
})

watch(() => props.initialValue, (value) => {
  Object.assign(design, value, { pinIconId: normalizePinIconId(value.pinIconId, props.category) })
}, { deep: true })

function useCustomImage(url: string) {
  if (!usesUploadedImage.value) design.pinIconType = 'custom'
  design.pinIconImageUrl = url
  errorMessage.value = ''
}

async function save() {
  const result = pinDesignSchema.safeParse(design)
  if (!result.success) {
    errorMessage.value = result.error.issues[0]?.message ?? 'ピンデザインを確認してください。'
    return
  }

  isSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const response = await $fetch<SpotPinDesignResponse>(`/api/maps/${props.mapId}/spots/${props.spotId}/design`, {
      method: 'PATCH',
      body: result.data,
    })
    Object.assign(design, response.design)
    emit('updated', response.design)
    successMessage.value = 'ピンデザインを保存しました。'
  }
  catch {
    errorMessage.value = 'ピンデザインを保存できませんでした。もう一度お試しください。'
  }
  finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div>
    <div class="grid gap-8 lg:grid-cols-[1fr_15rem]">
      <div>
        <h2 class="text-lg font-bold text-stone-900">ピンデザイン</h2>
        <p class="mt-1 text-sm text-stone-600">地図上でスポットをどのように見せるか選びます。</p>

        <fieldset class="mt-6">
          <legend class="text-sm font-semibold text-stone-800">表示方式</legend>
          <div class="mt-3 grid gap-3 sm:grid-cols-3">
            <label
              v-for="option in pinTypeOptions"
              :key="option.value"
              class="cursor-pointer rounded-xl border p-4 transition"
              :class="design.pinIconType === option.value ? 'border-terracotta-500 bg-terracotta-50 ring-2 ring-terracotta-100' : 'border-stone-200 hover:border-stone-400'"
            >
              <input v-model="design.pinIconType" type="radio" name="pin-icon-type" :value="option.value" class="sr-only">
              <span class="block text-sm font-bold text-stone-900">{{ option.label }}</span>
              <span class="mt-1 block text-xs leading-5 text-stone-500">{{ option.description }}</span>
            </label>
          </div>
        </fieldset>

        <fieldset v-if="design.pinIconType === 'preset'" class="mt-7">
          <legend class="text-sm font-semibold text-stone-800">プリセットアイコン</legend>
          <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <button v-for="preset in pinIconPresets" :key="preset.id" type="button" class="rounded-xl border p-3 text-center transition" :class="design.pinIconId === preset.id ? 'border-terracotta-500 bg-terracotta-50 ring-2 ring-terracotta-100' : 'border-stone-200 hover:border-stone-400'" @click="design.pinIconId = preset.id">
              <span class="mx-auto grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-white" :style="{ backgroundColor: design.pinColor }">{{ preset.symbol }}</span>
              <span class="mt-2 block text-xs font-semibold text-stone-700">{{ preset.label }}</span>
            </button>
          </div>
        </fieldset>

        <fieldset v-if="design.pinIconType !== 'illustration'" class="mt-7">
          <legend class="text-sm font-semibold text-stone-800">ピンカラー</legend>
          <div class="mt-3 flex flex-wrap items-center gap-3">
            <button v-for="color in colorPresets" :key="color" type="button" :aria-label="`ピン色 ${color}`" class="h-9 w-9 rounded-full border-2 border-white shadow ring-1" :class="design.pinColor.toUpperCase() === color ? 'ring-stone-900' : 'ring-stone-300'" :style="{ backgroundColor: color }" @click="design.pinColor = color" />
            <label class="flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-700">自由選択 <input v-model="design.pinColor" type="color" aria-label="自由なピン色" class="h-7 w-10 cursor-pointer border-0 bg-transparent p-0"></label>
          </div>
        </fieldset>

        <div v-if="usesUploadedImage" class="mt-7 border-t border-stone-200 pt-7">
          <h3 class="text-sm font-semibold text-stone-800">{{ uploadHeading }}</h3>
          <p v-if="design.pinIconType === 'custom'" class="mt-1 text-xs leading-5 text-stone-500">ロゴなど、背景が透明で正方形に近いPNG/JPEGを推奨します。</p>
          <p v-else class="mt-1 text-xs leading-5 text-stone-500">透過PNGを推奨します。画像の縦横比は保ったまま、台座を付けずに表示します。</p>
          <div class="mt-3 max-w-lg"><ImageUploader :label="uploadLabel" @uploaded="useCustomImage($event.url)" /></div>
        </div>
      </div>

      <aside class="rounded-xl bg-stone-100 p-5 text-center">
        <h3 class="text-sm font-semibold text-stone-700">プレビュー</h3>
        <div class="mt-6 flex min-h-20 items-center justify-center">
          <div v-if="design.pinIconType === 'illustration' && design.pinIconImageUrl" class="pin-design-marker pin-design-marker--illustration">
            <span class="pin-design-preview-shadow" aria-hidden="true" />
            <img :src="design.pinIconImageUrl" alt="直置きイラストのプレビュー" class="pin-design-illustration-preview">
          </div>
          <div v-else-if="design.pinIconType === 'illustration'" class="grid h-16 min-w-28 place-items-center rounded-lg border border-dashed border-stone-300 bg-white px-3 text-xs text-stone-400">
            画像未設定
          </div>
          <div v-else class="pin-design-marker">
            <span class="pin-design-preview-shadow" aria-hidden="true" />
            <div class="pin-design-preview" :style="previewStyle">
            <img v-if="design.pinIconType === 'custom' && design.pinIconImageUrl" :src="design.pinIconImageUrl" alt="カスタムピンのプレビュー" class="h-8 w-8 rounded-full bg-white object-cover">
            <span v-else>{{ selectedPreset.symbol }}</span>
            </div>
          </div>
        </div>
        <p class="mt-5 text-xs text-stone-500">地図上では常に正面を向いて表示されます。</p>
      </aside>
    </div>

    <p v-if="errorMessage" role="alert" class="mt-5 text-sm text-red-600">{{ errorMessage }}</p>
    <p v-if="successMessage" role="status" class="mt-5 text-sm text-emerald-700">{{ successMessage }}</p>
    <div class="mt-6 flex justify-end"><button type="button" :disabled="isSaving" class="rounded-lg bg-terracotta-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60" @click="save">{{ isSaving ? '保存中…' : 'ピンデザインを保存' }}</button></div>
  </div>
</template>

<style>
.pin-design-marker {
  position: relative;
  display: inline-flex;
  min-width: 4rem;
  height: 4.75rem;
  align-items: flex-start;
  justify-content: center;
}

.pin-design-marker--illustration {
  width: max-content;
  min-width: 3rem;
  height: 4rem;
}

.pin-design-preview-shadow {
  position: absolute;
  bottom: 0.1rem;
  left: 50%;
  width: 2.25rem;
  height: 0.625rem;
  border-radius: 50%;
  background: rgb(37 48 58 / 28%);
  filter: blur(2px);
  transform: translateX(-50%);
}

.pin-design-preview {
  position: relative;
  z-index: 1;
  display: grid;
  width: 4rem;
  height: 4rem;
  place-items: center;
  border: 4px solid white;
  border-radius: 9999px 9999px 9999px 0;
  background-color: var(--pin-color);
  background-image: radial-gradient(circle at 32% 28%, var(--pin-color-light), var(--pin-color) 55%, var(--pin-color-dark));
  box-shadow:
    0 7px 12px rgb(37 48 58 / 35%),
    inset -3px -3px 6px rgb(0 0 0 / 25%),
    inset 2px 2px 4px rgb(255 255 255 / 35%);
  color: white;
  font-size: 1.25rem;
  font-weight: 800;
  transform: rotate(-45deg);
}

.pin-design-preview > * {
  transform: rotate(45deg);
}

.pin-design-illustration-preview {
  position: relative;
  z-index: 1;
  display: block;
  width: auto;
  height: 3rem;
  max-width: 10rem;
  object-fit: contain;
  filter: drop-shadow(0 5px 5px rgb(37 48 58 / 32%));
}
</style>
