<script setup lang="ts">
import ImageUploader from '~/components/admin/ImageUploader.vue'
import { defaultPinIconId, getPinIconPreset, pinIconPresets } from '~~/shared/constants/spot'
import { pinDesignSchema, type PinDesignInput } from '~~/shared/schemas/pin-design'
import type { SpotPinDesignResponse } from '~~/shared/types/spot'

const props = defineProps<{
  mapId: string
  spotId: string
  category: string
  initialValue: {
    pinIconType: 'preset' | 'custom'
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
  pinIconId: props.initialValue.pinIconId ?? defaultPinIconId(props.category),
})
const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const colorPresets = ['#C7401F', '#2563EB', '#047857', '#7C3AED', '#D97706', '#292524']
const selectedPreset = computed(() => getPinIconPreset(design.pinIconId))

watch(() => props.initialValue, (value) => {
  Object.assign(design, value, { pinIconId: value.pinIconId ?? defaultPinIconId(props.category) })
}, { deep: true })

function useCustomImage(url: string) {
  design.pinIconType = 'custom'
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
        <p class="mt-1 text-sm text-stone-600">プリセットまたは独自画像を選び、ピンの地色を設定します。</p>

        <fieldset class="mt-6">
          <legend class="text-sm font-semibold text-stone-800">プリセットアイコン</legend>
          <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <button v-for="preset in pinIconPresets" :key="preset.id" type="button" class="rounded-xl border p-3 text-center transition" :class="design.pinIconType === 'preset' && design.pinIconId === preset.id ? 'border-terracotta-500 bg-terracotta-50 ring-2 ring-terracotta-100' : 'border-stone-200 hover:border-stone-400'" @click="design.pinIconType = 'preset'; design.pinIconId = preset.id">
              <span class="mx-auto grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-white" :style="{ backgroundColor: design.pinColor }">{{ preset.symbol }}</span>
              <span class="mt-2 block text-xs font-semibold text-stone-700">{{ preset.label }}</span>
            </button>
          </div>
        </fieldset>

        <fieldset class="mt-7">
          <legend class="text-sm font-semibold text-stone-800">ピンカラー</legend>
          <div class="mt-3 flex flex-wrap items-center gap-3">
            <button v-for="color in colorPresets" :key="color" type="button" :aria-label="`ピン色 ${color}`" class="h-9 w-9 rounded-full border-2 border-white shadow ring-1" :class="design.pinColor.toUpperCase() === color ? 'ring-stone-900' : 'ring-stone-300'" :style="{ backgroundColor: color }" @click="design.pinColor = color" />
            <label class="flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-700">自由選択 <input v-model="design.pinColor" type="color" aria-label="自由なピン色" class="h-7 w-10 cursor-pointer border-0 bg-transparent p-0"></label>
          </div>
        </fieldset>

        <div class="mt-7 border-t border-stone-200 pt-7">
          <h3 class="text-sm font-semibold text-stone-800">カスタム画像</h3>
          <p class="mt-1 text-xs leading-5 text-stone-500">ロゴなど、背景が透明で正方形に近いPNG/JPEGを推奨します。</p>
          <div class="mt-3 max-w-lg"><ImageUploader label="カスタムピン画像" @uploaded="useCustomImage($event.url)" /></div>
        </div>
      </div>

      <aside class="rounded-xl bg-stone-100 p-5 text-center">
        <h3 class="text-sm font-semibold text-stone-700">プレビュー</h3>
        <div class="mt-6 flex justify-center">
          <div class="pin-design-preview" :style="{ '--pin-color': design.pinColor }">
            <img v-if="design.pinIconType === 'custom' && design.pinIconImageUrl" :src="design.pinIconImageUrl" alt="カスタムピンのプレビュー" class="h-8 w-8 rounded-full bg-white object-cover">
            <span v-else>{{ selectedPreset.symbol }}</span>
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
.pin-design-preview {
  display: grid;
  width: 4rem;
  height: 4rem;
  place-items: center;
  border: 4px solid white;
  border-radius: 9999px 9999px 9999px 0;
  background: var(--pin-color);
  box-shadow: 0 4px 12px rgb(0 0 0 / 25%);
  color: white;
  font-size: 1.25rem;
  font-weight: 800;
  transform: rotate(-45deg);
}

.pin-design-preview > * {
  transform: rotate(45deg);
}
</style>
