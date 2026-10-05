<script setup lang="ts">
import type { PinAppearance } from '~~/shared/utils/pin-appearance'
import { getPinIconPreset, isFacilityPinIcon } from '~~/shared/constants/spot'
const props = defineProps<{ appearance: PinAppearance, label: string, compact?: boolean }>()
const preset = computed(() => getPinIconPreset(props.appearance.pinIconId))
const facility = computed(() => isFacilityPinIcon(props.appearance))
</script>
<template>
  <figure class="inline-flex items-center gap-2" :class="compact ? '' : 'flex-col rounded border border-stone-200 bg-white p-3'">
    <span class="grid shrink-0 content-center place-items-center overflow-hidden" :class="[compact ? 'h-6 w-6 text-sm' : 'h-12 w-12 text-xl', facility ? 'rounded-lg border-2 text-stone-900' : appearance.pinIconType === 'illustration' ? '' : 'rounded-full text-white']" :style="{ backgroundColor: appearance.pinIconType === 'illustration' ? 'transparent' : facility ? 'white' : appearance.pinColor, borderColor: facility ? appearance.pinColor : undefined }">
      <img v-if="appearance.pinIconType !== 'preset' && appearance.pinIconImageUrl" :src="appearance.pinIconImageUrl" alt="" class="h-full w-full object-contain">
      <template v-else>
        <img v-if="facility && preset.imageUrl" :src="preset.imageUrl" alt="" aria-hidden="true" class="object-contain" :class="compact ? preset.text ? 'h-3 w-4' : 'h-4 w-4' : preset.text ? 'h-6 w-8' : 'h-8 w-8'">
        <span v-else class="max-w-full overflow-hidden whitespace-nowrap leading-none" :class="preset.family === 'material' ? 'material-symbols-outlined' : ''" aria-hidden="true">{{ preset.symbol }}</span>
        <span v-if="facility && preset.text" class="font-extrabold leading-none" :class="compact ? 'text-[6px]' : 'text-[10px]'" aria-hidden="true">{{ preset.text }}</span>
      </template>
    </span>
    <figcaption class="text-xs">{{ label }}<template v-if="facility"> · 設備：{{ preset.label }}</template> · {{ appearance.pinSize === 'small' ? '小' : appearance.pinSize === 'large' ? '大' : '中' }}</figcaption>
  </figure>
</template>
