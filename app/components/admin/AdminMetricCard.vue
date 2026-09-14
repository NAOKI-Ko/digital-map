<script setup lang="ts">
defineProps<{ label: string, value: string | number, hint?: string, tone?: 'neutral' | 'warning' | 'accent' }>()
</script>

<template>
  <article class="rounded-xl border border-stone-200 bg-white px-5 py-4 shadow-sm">
    <p class="text-xs font-semibold tracking-wide text-stone-500">{{ label }}</p>
    <p class="mt-2 text-2xl font-bold tracking-tight" :class="tone === 'warning' ? 'text-amber-800' : tone === 'accent' ? 'text-terracotta-700' : 'text-stone-950'">{{ value }}</p>
    <p v-if="hint" class="mt-1 text-xs text-stone-500">{{ hint }}</p>
  </article>
</template>

