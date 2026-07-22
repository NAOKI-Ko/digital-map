<script setup lang="ts">
import type { PublicFloor } from '~~/shared/types/public-map'

defineProps<{
  floors: readonly PublicFloor[]
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [floorId: string]
}>()
</script>

<template>
  <div
    v-if="floors.length > 1"
    class="flex max-w-full overscroll-x-contain gap-2 overflow-x-auto px-1 pb-1"
    role="tablist"
    aria-label="フロアを切り替え"
  >
    <button
      v-for="floor in floors"
      :key="floor.id"
      type="button"
      role="tab"
      class="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition"
      :class="modelValue === floor.id ? 'bg-terracotta-600 text-white' : 'bg-white/95 text-stone-700 hover:bg-white'"
      :aria-selected="modelValue === floor.id"
      @click="$emit('update:modelValue', floor.id)"
    >
      {{ floor.name }}
    </button>
  </div>
</template>
