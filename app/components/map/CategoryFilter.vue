<script setup lang="ts">
defineProps<{
  categories: readonly string[]
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [category: string]
}>()
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
      :class="modelValue === '' ? 'bg-stone-900 text-white' : 'bg-white/95 text-stone-700 hover:bg-white'"
      :aria-pressed="modelValue === ''"
      @click="$emit('update:modelValue', '')"
    >
      すべて
    </button>
    <button
      v-for="category in categories"
      :key="category"
      type="button"
      class="shrink-0 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition"
      :class="modelValue === category ? 'bg-terracotta-600 text-white' : 'bg-white/95 text-stone-700 hover:bg-white'"
      :aria-pressed="modelValue === category"
      @click="$emit('update:modelValue', category)"
    >
      {{ category }}
    </button>
  </div>
</template>
