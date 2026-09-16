<script setup lang="ts">
import type { SpotCategorySummary } from '~~/shared/types/category'

const props = defineProps<{ categories: readonly SpotCategorySummary[], modelValue: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [categoryIds: string[]] }>()

function toggleCategory(categoryId: string) {
  emit('update:modelValue', props.modelValue.includes(categoryId)
    ? props.modelValue.filter(id => id !== categoryId)
    : [...props.modelValue, categoryId])
}
</script>

<template>
  <div v-if="categories.length" class="flex w-full snap-x gap-2 overflow-x-auto overscroll-x-contain px-0.5 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="カテゴリで絞り込み">
    <button type="button" class="grid min-h-11 shrink-0 snap-start place-items-center rounded-full p-1 text-[13px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-stone-900" :aria-pressed="modelValue.length === 0" @click="emit('update:modelValue', [])">
      <span class="flex h-9 items-center rounded-full px-3 shadow-sm backdrop-blur transition" :class="modelValue.length === 0 ? 'bg-stone-900 text-white' : 'bg-white/85 text-stone-700 hover:bg-white'">すべて</span>
    </button>
    <button v-for="category in categories" :key="category.id" type="button" class="grid min-h-11 min-w-11 shrink-0 snap-start place-items-center rounded-full p-1 text-[13px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-stone-900" :aria-pressed="modelValue.includes(category.id)" @click="toggleCategory(category.id)">
      <span class="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-3 shadow-sm backdrop-blur transition" :class="modelValue.includes(category.id) ? 'bg-terracotta-600 text-white' : 'bg-white/85 text-stone-700 hover:bg-white'"><CategoryIcon :icon-type="category.iconType" :icon-preset-id="category.iconPresetId" :icon-image-url="category.iconImageUrl" size="sm" /><span>{{ category.name }}</span></span>
    </button>
  </div>
</template>
