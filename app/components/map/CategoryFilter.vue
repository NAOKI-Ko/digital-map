<script setup lang="ts">
import type { SpotCategorySummary } from '~~/shared/types/category'

defineProps<{
  categories: readonly SpotCategorySummary[]
  modelValue: string[]
}>()

defineEmits<{
  'update:modelValue': [categoryIds: string[]]
}>()

function toggleCategory(categoryId: string, selected: string[]) {
  return selected.includes(categoryId)
    ? selected.filter(id => id !== categoryId)
    : [...selected, categoryId]
}
</script>

<template>
  <div
    v-if="categories.length"
    class="flex max-w-full overscroll-x-contain gap-2 overflow-x-auto px-1 pb-1"
    role="group"
    aria-label="カテゴリで絞り込み"
  >
    <button
      type="button"
      class="shrink-0 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition"
      :class="modelValue.length === 0 ? 'bg-stone-900 text-white' : 'bg-white/95 text-stone-700 hover:bg-white'"
      :aria-pressed="modelValue.length === 0"
      @click="$emit('update:modelValue', [])"
    >
      すべて
    </button>
    <button
      v-for="category in categories"
      :key="category.id"
      type="button"
      class="shrink-0 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition"
      :class="modelValue.includes(category.id) ? 'bg-terracotta-600 text-white' : 'bg-white/95 text-stone-700 hover:bg-white'"
      :aria-pressed="modelValue.includes(category.id)"
      @click="$emit('update:modelValue', toggleCategory(category.id, modelValue))"
    >
      {{ category.name }}
    </button>
  </div>
</template>
