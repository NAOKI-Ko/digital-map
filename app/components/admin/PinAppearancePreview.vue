<script setup lang="ts">
import type { PinAppearance } from '~~/shared/utils/pin-appearance'
import { getPinIconPreset } from '~~/shared/constants/spot'
defineProps<{ appearance: PinAppearance, label: string }>()
</script>
<template>
  <figure class="inline-flex flex-col items-center gap-2 rounded border border-stone-200 bg-white p-3">
    <span class="grid h-12 w-12 place-items-center overflow-hidden text-xl text-white" :class="appearance.pinIconType === 'illustration' ? '' : 'rounded-full'" :style="{ backgroundColor: appearance.pinIconType === 'illustration' ? 'transparent' : appearance.pinColor }">
      <img v-if="appearance.pinIconType !== 'preset' && appearance.pinIconImageUrl" :src="appearance.pinIconImageUrl" alt="" class="h-full w-full object-contain">
      <span v-else :class="getPinIconPreset(appearance.pinIconId).family === 'material' ? 'material-symbols-rounded' : ''">{{ getPinIconPreset(appearance.pinIconId).symbol }}</span>
    </span>
    <figcaption class="text-xs">{{ label }} · {{ appearance.pinSize === 'small' ? '小' : appearance.pinSize === 'large' ? '大' : '中' }}</figcaption>
  </figure>
</template>
