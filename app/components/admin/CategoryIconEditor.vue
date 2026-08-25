<script setup lang="ts">
import ImageUploader from './ImageUploader.vue'
import { categoryIconPresets, type CategoryIconType } from '~~/shared/constants/category'

export interface CategoryIconDraft {
  iconType: CategoryIconType | null
  iconPresetId: string | null
  iconImageUrl: string | null
}

const props = defineProps<{ modelValue: CategoryIconDraft, uploadUrl: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: CategoryIconDraft] }>()

function selectType(type: CategoryIconType | null) {
  if (type === null) emit('update:modelValue', { iconType: null, iconPresetId: null, iconImageUrl: null })
  else if (type === 'preset') emit('update:modelValue', { iconType: 'preset', iconPresetId: props.modelValue.iconPresetId ?? categoryIconPresets[0].id, iconImageUrl: null })
  else emit('update:modelValue', { iconType: 'custom', iconPresetId: null, iconImageUrl: props.modelValue.iconImageUrl })
}

function selectPreset(iconPresetId: string) {
  emit('update:modelValue', { iconType: 'preset', iconPresetId, iconImageUrl: null })
}

function useImage(iconImageUrl: string) {
  emit('update:modelValue', { iconType: 'custom', iconPresetId: null, iconImageUrl })
}
</script>

<template>
  <fieldset>
    <legend class="text-sm font-semibold text-stone-800">カテゴリーアイコン</legend>
    <div class="mt-3 grid gap-2 sm:grid-cols-3">
      <button type="button" class="rounded-lg border px-3 py-2 text-sm font-semibold" :class="modelValue.iconType === null ? 'border-terracotta-500 bg-terracotta-50' : 'border-stone-300 bg-white'" :aria-pressed="modelValue.iconType === null" @click="selectType(null)">アイコンなし</button>
      <button type="button" class="rounded-lg border px-3 py-2 text-sm font-semibold" :class="modelValue.iconType === 'preset' ? 'border-terracotta-500 bg-terracotta-50' : 'border-stone-300 bg-white'" :aria-pressed="modelValue.iconType === 'preset'" @click="selectType('preset')">プリセット</button>
      <button type="button" class="rounded-lg border px-3 py-2 text-sm font-semibold" :class="modelValue.iconType === 'custom' ? 'border-terracotta-500 bg-terracotta-50' : 'border-stone-300 bg-white'" :aria-pressed="modelValue.iconType === 'custom'" @click="selectType('custom')">カスタム画像</button>
    </div>
    <div v-if="modelValue.iconType === 'preset'" class="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7">
      <button v-for="preset in categoryIconPresets" :key="preset.id" type="button" class="rounded-lg border p-2 text-center" :class="modelValue.iconPresetId === preset.id ? 'border-terracotta-500 bg-terracotta-50 ring-2 ring-terracotta-100' : 'border-stone-200 bg-white hover:border-stone-400'" :aria-pressed="modelValue.iconPresetId === preset.id" @click="selectPreset(preset.id)">
        <span class="material-symbols-outlined block text-2xl" aria-hidden="true">{{ preset.name }}</span><span class="mt-1 block truncate text-[0.7rem] font-semibold text-stone-600">{{ preset.label }}</span>
      </button>
    </div>
    <div v-if="modelValue.iconType === 'custom'" class="mt-4">
      <div v-if="modelValue.iconImageUrl" class="mb-4 flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-3"><img :src="modelValue.iconImageUrl" alt="" class="size-16 rounded-lg bg-stone-50 object-contain"><p class="text-sm text-stone-600">現在のカスタム画像</p></div>
      <p class="mb-3 text-xs leading-5 text-stone-500">正方形に近い透過PNGを推奨します。縦横比を保ったまま表示します。</p>
      <ImageUploader label="カテゴリーアイコン画像" :upload-url="uploadUrl" @uploaded="useImage($event.url)" />
    </div>
  </fieldset>
</template>
