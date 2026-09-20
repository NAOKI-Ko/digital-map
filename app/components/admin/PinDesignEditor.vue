<script setup lang="ts">
import UnsavedChangesGuard from '~/components/admin/UnsavedChangesGuard.vue'
import MediaPicker from '~/components/admin/MediaPicker.vue'
import type { UploadedImage } from '~~/shared/types/upload'
import {
  defaultMaterialSymbolId,
  defaultPinIconId,
  getPinIconPreset,
  materialSymbolPresets,
  normalizePinIconId,
  pinIconPresets,
  type MaterialSymbolPresetId,
  type PinIconFamily,
  type PinIconPresetId,
  type PinIconType,
  type PinSize,
} from '~~/shared/constants/spot'
import { pinDesignSchema, type PinDesignInput } from '~~/shared/schemas/pin-design'
import type { SpotPinDesignResponse } from '~~/shared/types/spot'

const props = withDefaults(defineProps<{
  mapId: string
  spotId: string
  compact?: boolean
  showSave?: boolean
  guardNavigation?: boolean
  initialValue: {
    pinIconType: PinIconType
    pinIconId: string | null
    pinIconImageUrl: string | null
    pinIconAssetId?: string | null
    pinColor: string
    pinSize: PinSize
    importance?: 'normal' | 'featured'
  }
}>(), { compact: false, showSave: true, guardNavigation: true })

const emit = defineEmits<{
  updated: [design: SpotPinDesignResponse['design']]
  changed: [design: SpotPinDesignResponse['design']]
}>()

const design = reactive<PinDesignInput>({
  ...props.initialValue,
  pinIconId: normalizePinIconId(props.initialValue.pinIconId),
  importance: props.initialValue.importance ?? 'normal',
})
const isSaving = ref(false)
const errorMessage = ref('')
const { success } = useToast()
const normalizedInitialValue = computed(() => ({ ...props.initialValue, pinIconId: normalizePinIconId(props.initialValue.pinIconId), importance: props.initialValue.importance ?? 'normal' }))
const isDirty = computed(() => JSON.stringify(design) !== JSON.stringify(normalizedInitialValue.value))
const colorPresets = ['#C7401F', '#2563EB', '#047857', '#7C3AED', '#D97706', '#292524']
const pinTypeOptions: Array<{ value: PinIconType, label: string }> = [
  { value: 'preset', label: 'プリセット' },
  { value: 'custom', label: 'カスタム' },
  { value: 'illustration', label: 'イラスト' },
]
const selectedPreset = computed(() => getPinIconPreset(design.pinIconId))
const materialPresetGroups = computed(() => {
  const groups = new Map<string, typeof materialSymbolPresets[number][]>()
  materialSymbolPresets.forEach((preset) => groups.set(preset.group, [...(groups.get(preset.group) ?? []), preset]))
  return [...groups.entries()]
})
const selectedIconFamily = computed(() => selectedPreset.value.family)
const lastKanjiIconId = ref<PinIconPresetId>(
  selectedPreset.value.family === 'kanji'
    ? selectedPreset.value.id
    : defaultPinIconId(),
)
const lastMaterialIconId = ref<MaterialSymbolPresetId>(
  selectedPreset.value.family === 'material'
    ? selectedPreset.value.id
    : defaultMaterialSymbolId(),
)
const usesUploadedImage = computed(() => design.pinIconType === 'custom' || design.pinIconType === 'illustration')
const uploadHeading = computed(() => design.pinIconType === 'illustration' ? '直置きイラスト' : 'カスタム画像')
const uploadLabel = computed(() => design.pinIconType === 'illustration' ? '直置きイラスト画像' : 'カスタムピン画像')

watch(() => props.initialValue, (value) => {
  Object.assign(design, value, { pinIconId: normalizePinIconId(value.pinIconId), importance: value.importance ?? 'normal' })
}, { deep: true })

watch(() => design.pinIconId, (pinIconId) => {
  const preset = getPinIconPreset(pinIconId)
  if (preset.family === 'material') lastMaterialIconId.value = preset.id
  else lastKanjiIconId.value = preset.id
})

watch(design, value => emit('changed', { ...value, importance: value.importance ?? 'normal' }), { deep: true })

function selectIconFamily(family: PinIconFamily) {
  design.pinIconId = family === 'material'
    ? lastMaterialIconId.value
    : lastKanjiIconId.value
}

function useCustomImage(image: UploadedImage) {
  if (!usesUploadedImage.value) design.pinIconType = 'custom'
  design.pinIconImageUrl = image.url
  design.pinIconAssetId = image.assetId
  errorMessage.value = ''
}

async function save(): Promise<SpotPinDesignResponse['design'] | null> {
  const result = pinDesignSchema.safeParse(design)
  if (!result.success) {
    errorMessage.value = result.error.issues[0]?.message ?? 'ピンデザインを確認してください。'
    return null
  }

  isSaving.value = true
  errorMessage.value = ''
  try {
    const response = await $fetch<SpotPinDesignResponse>(`/api/maps/${props.mapId}/spots/${props.spotId}/design`, {
      method: 'PATCH',
      body: result.data,
    })
    Object.assign(design, response.design)
    emit('updated', response.design)
    success('ピンデザインを保存しました', `pin-design-${props.spotId}`)
    return response.design
  }
  catch {
    errorMessage.value = 'ピンデザインを保存できませんでした。もう一度お試しください。'
    return null
  }
  finally {
    isSaving.value = false
  }
}

function reset() {
  Object.assign(design, normalizedInitialValue.value)
  errorMessage.value = ''
}

defineExpose({ isDirty: () => isDirty.value, reset, save })
</script>

<template>
  <div>
    <div>
      <div>
        <h2 class="text-lg font-bold text-stone-900">ピンデザイン</h2>

        <fieldset class="mt-6">
          <legend class="text-sm font-semibold text-stone-800">表示方式</legend>
          <div class="mt-3 grid gap-3 sm:grid-cols-3">
            <label
              v-for="option in pinTypeOptions"
              :key="option.value"
              class="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-center transition"
              :class="design.pinIconType === option.value ? 'border-terracotta-500 bg-terracotta-50 ring-2 ring-terracotta-100' : 'border-stone-200 hover:border-stone-400'"
            >
              <input v-model="design.pinIconType" type="radio" name="pin-icon-type" :value="option.value" class="sr-only">
              <span class="block text-sm font-bold text-stone-900">{{ option.label }}</span>
            </label>
          </div>
        </fieldset>

        <fieldset v-if="design.pinIconType === 'preset'" class="mt-7">
          <legend class="text-sm font-semibold text-stone-800">プリセットアイコン</legend>
          <div class="mt-3 inline-flex rounded-lg border border-stone-300 bg-stone-100 p-1" aria-label="アイコンファミリー">
            <button
              type="button"
              class="rounded-md px-4 py-2 text-sm font-semibold transition"
              :class="selectedIconFamily === 'kanji' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'"
              :aria-pressed="selectedIconFamily === 'kanji'"
              @click="selectIconFamily('kanji')"
            >
              文字アイコン
            </button>
            <button
              type="button"
              class="rounded-md px-4 py-2 text-sm font-semibold transition"
              :class="selectedIconFamily === 'material' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'"
              :aria-pressed="selectedIconFamily === 'material'"
              @click="selectIconFamily('material')"
            >
              Material Symbols
            </button>
          </div>

          <div v-if="selectedIconFamily === 'kanji'" class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <button v-for="preset in pinIconPresets" :key="preset.id" type="button" :aria-label="preset.label" :aria-pressed="design.pinIconId === preset.id" class="grid min-h-12 place-items-center rounded-xl border p-2 text-center transition" :class="design.pinIconId === preset.id ? 'border-terracotta-500 bg-terracotta-50 ring-2 ring-terracotta-100' : 'border-stone-200 hover:border-stone-400'" @click="design.pinIconId = preset.id">
              <span class="grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white" :style="{ backgroundColor: design.pinColor }" aria-hidden="true">{{ preset.symbol }}</span>
            </button>
          </div>
          <div v-else class="mt-3 space-y-5">
            <section v-for="[group, presets] in materialPresetGroups" :key="group">
              <h4 class="text-xs font-bold text-stone-500">{{ group }}</h4>
              <div class="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <button v-for="preset in presets" :key="preset.id" type="button" :aria-label="preset.label" :aria-pressed="design.pinIconId === preset.id" class="grid min-h-12 place-items-center rounded-xl border p-2 text-center transition" :class="design.pinIconId === preset.id ? 'border-terracotta-500 bg-terracotta-50 ring-2 ring-terracotta-100' : 'border-stone-200 hover:border-stone-400'" @click="design.pinIconId = preset.id">
                  <span class="material-symbols-outlined grid h-8 w-8 place-items-center rounded-full text-base text-white" :style="{ backgroundColor: design.pinColor }" aria-hidden="true">{{ preset.name }}</span>
                </button>
              </div>
            </section>
          </div>
        </fieldset>

        <fieldset v-if="design.pinIconType !== 'illustration'" class="mt-7">
          <legend class="text-sm font-semibold text-stone-800">ピンカラー</legend>
          <div class="mt-3 flex flex-wrap items-center gap-3">
            <button v-for="color in colorPresets" :key="color" type="button" :aria-label="`ピン色 ${color}`" class="h-9 w-9 rounded-full border-2 border-white shadow ring-1" :class="design.pinColor.toUpperCase() === color ? 'ring-stone-900' : 'ring-stone-300'" :style="{ backgroundColor: color }" @click="design.pinColor = color" />
            <label class="flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-700">自由選択 <input v-model="design.pinColor" type="color" aria-label="自由なピン色" class="h-7 w-10 cursor-pointer border-0 bg-transparent p-0"></label>
          </div>
        </fieldset>

        <fieldset class="mt-7">
          <legend class="text-sm font-semibold text-stone-800">表示サイズ</legend>
          <p class="mt-1 text-xs text-stone-500">重要度とは独立した見た目のサイズです。</p>
          <div class="mt-3 flex gap-2">
            <label v-for="item in [{ id: 'small', label: '小' }, { id: 'medium', label: '中' }, { id: 'large', label: '大' }]" :key="item.id" class="rounded-lg border px-4 py-2 text-sm">
              <input v-model="design.pinSize" type="radio" name="pin-size" :value="item.id" class="mr-2">{{ item.label }}
            </label>
          </div>
        </fieldset>

        <fieldset class="mt-7">
          <legend class="text-sm font-semibold text-stone-800">表示優先度</legend>
          <div class="mt-3 flex gap-2">
            <label v-for="item in [{ id: 'normal', label: '通常' }, { id: 'featured', label: '注目' }]" :key="item.id" class="rounded-lg border px-4 py-2 text-sm">
              <input v-model="design.importance" type="radio" name="pin-importance" :value="item.id" class="mr-2">{{ item.label }}
            </label>
          </div>
        </fieldset>

        <div v-if="usesUploadedImage" class="mt-7 border-t border-stone-200 pt-7">
          <h3 class="text-sm font-semibold text-stone-800">{{ uploadHeading }}</h3>
          <p v-if="design.pinIconType === 'custom'" class="mt-1 text-xs leading-5 text-stone-500">ロゴなど、背景が透明で正方形に近いPNG/JPEGを推奨します。</p>
          <p v-else class="mt-1 text-xs leading-5 text-stone-500">透過PNGを推奨します。画像の縦横比は保ったまま、台座を付けずに表示します。</p>
          <div class="mt-3 max-w-3xl"><MediaPicker :map-id="mapId" :label="uploadLabel" usage="pin" :selected-url="design.pinIconImageUrl" @selected="useCustomImage" /></div>
        </div>
      </div>

    </div>

    <p v-if="errorMessage" role="alert" class="mt-5 text-sm text-red-600">{{ errorMessage }}</p>
    <div v-if="showSave" class="mt-6 flex justify-end"><button type="button" :disabled="isSaving" class="rounded-lg bg-terracotta-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60" @click="save">{{ isSaving ? '保存中…' : 'ピンデザインを保存' }}</button></div>
  </div>
  <UnsavedChangesGuard v-if="guardNavigation" :dirty="isDirty && !isSaving" />
</template>
