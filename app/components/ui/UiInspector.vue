<script setup lang="ts">
withDefaults(defineProps<{ title?: string }>(), { title: '' })
</script>
<template>
  <aside class="flex min-h-0 flex-col border-stone-200 bg-white lg:h-full lg:border-l" :aria-label="title || undefined">
    <header v-if="title || $slots.header" class="shrink-0 border-b border-stone-200 px-5 py-4"><slot name="header"><h2 class="text-lg font-bold text-stone-950">{{ title }}</h2></slot></header>
    <div class="min-h-0 flex-1 overflow-y-auto p-5"><slot /></div>
    <footer v-if="$slots.footer" class="shrink-0 border-t border-stone-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"><slot name="footer" /></footer>
  </aside>
</template>
