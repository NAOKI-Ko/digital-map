<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' }>(), { tone: 'neutral' })
</script>
<template><span class="inline-flex min-h-6 items-center rounded-full px-2.5 text-xs font-semibold" :class="{ 'bg-stone-100 text-stone-700': tone === 'neutral', 'bg-terracotta-50 text-terracotta-800': tone === 'accent', 'bg-emerald-50 text-emerald-800': tone === 'success', 'bg-amber-50 text-amber-900': tone === 'warning', 'bg-red-50 text-red-800': tone === 'danger' }"><slot /></span></template>
