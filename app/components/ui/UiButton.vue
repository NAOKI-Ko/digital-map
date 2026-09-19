<script setup lang="ts">
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'icon'
  type?: 'button' | 'submit' | 'reset'
  busy?: boolean
}>(), {
  variant: 'primary',
  type: 'button',
  busy: false,
})
</script>

<template>
  <button
    v-bind="$attrs"
    :type="type"
    :aria-busy="busy || undefined"
    :class="[
      'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
      variant === 'primary' && 'bg-terracotta-600 text-white hover:bg-terracotta-700',
      variant === 'secondary' && 'border border-stone-300 bg-white text-stone-800 hover:bg-stone-100',
      variant === 'ghost' && 'text-stone-700 hover:bg-stone-100',
      variant === 'destructive' && 'bg-red-700 text-white hover:bg-red-800',
      variant === 'icon' && 'size-11 rounded-full p-0 text-stone-700 hover:bg-stone-100',
    ]"
  >
    <slot />
  </button>
</template>
