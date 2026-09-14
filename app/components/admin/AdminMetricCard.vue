<script setup lang="ts">
defineProps<{ label: string, value: string | number, hint?: string, tone?: 'neutral' | 'warning' | 'accent' }>()
</script>

<template>
  <article class="min-w-0 px-4 py-3 sm:px-6">
    <p class="text-xs font-semibold tracking-wide text-stone-500">{{ label }}</p>
    <p class="mt-1 text-2xl font-bold tracking-tight" :class="tone === 'warning' ? 'text-amber-800' : tone === 'accent' ? 'text-terracotta-700' : 'text-stone-950'">{{ value }}</p>
    <p v-if="hint" class="mt-1 text-xs text-stone-500">{{ hint }}</p>
  </article>
</template>

