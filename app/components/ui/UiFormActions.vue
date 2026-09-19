<script setup lang="ts">
withDefaults(defineProps<{ stickyMobile?: boolean }>(), { stickyMobile: false })
</script>

<template>
  <div
    class="flex flex-col-reverse gap-2 border-t border-stone-200 pt-5 sm:flex-row sm:items-center sm:justify-end"
    :class="stickyMobile ? 'sticky bottom-0 z-10 -mx-4 bg-white/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:backdrop-blur-none' : ''"
  >
    <slot />
  </div>
</template>
