<script setup lang="ts">
defineProps<{ eyebrow?: string, title: string, description?: string }>()
</script>

<template>
  <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div class="min-w-0">
      <p v-if="eyebrow" class="text-sm font-semibold text-terracotta-700">{{ eyebrow }}</p>
      <h1 class="mt-1 text-2xl font-bold tracking-tight text-stone-950 sm:text-3xl">{{ title }}</h1>
      <p v-if="description" class="mt-2 max-w-2xl text-sm leading-6 text-stone-600">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="flex shrink-0 flex-wrap gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>

