<script setup lang="ts">
import { getCategoryIconPreset } from '~~/shared/constants/category'

const props = withDefaults(defineProps<{
  iconType: string | null
  iconPresetId: string | null
  iconImageUrl: string | null
  size?: 'sm' | 'md' | 'lg'
}>(), { size: 'md' })

const preset = computed(() => getCategoryIconPreset(props.iconPresetId))
const sizeClass = computed(() => ({
  sm: 'size-4 text-[0.95rem]',
  md: 'size-5 text-lg',
  lg: 'size-10 text-2xl',
}[props.size]))
</script>

<template>
  <span v-if="iconType === 'preset' && preset" aria-hidden="true" class="category-icon material-symbols-outlined" :class="sizeClass">{{ preset.name }}</span>
  <img v-else-if="iconType === 'custom' && iconImageUrl" :src="iconImageUrl" alt="" class="category-icon rounded object-contain" :class="sizeClass">
</template>

<style scoped>
.category-icon {
  display: inline-grid;
  flex: none;
  place-items: center;
  line-height: 1;
}
</style>
