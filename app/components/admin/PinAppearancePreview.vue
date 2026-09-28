<script setup lang="ts">
import type { PinAppearance } from '~~/shared/utils/pin-appearance'
import { getPinIconPreset } from '~~/shared/constants/spot'
defineProps<{ appearance: PinAppearance, label: string, compact?: boolean }>()
</script>
<template>
  <figure class="inline-flex items-center gap-2" :class="compact ? '' : 'flex-col rounded border border-stone-200 bg-white p-3'">
    <span class="grid shrink-0 place-items-center overflow-hidden text-white" :class="[compact ? 'h-6 w-6 text-sm' : 'h-12 w-12 text-xl', appearance.pinIconType === 'illustration' ? '' : 'rounded-full']" :style="{ backgroundColor: appearance.pinIconType === 'illustration' ? 'transparent' : appearance.pinColor }">
      <img v-if="appearance.pinIconType !== 'preset' && appearance.pinIconImageUrl" :src="appearance.pinIconImageUrl" alt="" class="h-full w-full object-contain">
      <span v-else :class="getPinIconPreset(appearance.pinIconId).family === 'material' ? 'material-symbols-rounded' : ''">{{ getPinIconPreset(appearance.pinIconId).symbol }}</span>
    </span>
    <figcaption class="text-xs">{{ label }} · {{ appearance.pinSize === 'small' ? '小' : appearance.pinSize === 'large' ? '大' : '中' }}</figcaption>
  </figure>
</template>
