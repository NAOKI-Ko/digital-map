<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui'

withDefaults(defineProps<{
  modelValue: boolean
  label: string
  disabled?: boolean
}>(), { disabled: false })

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

<template>
  <div class="inline-flex min-h-11 items-center gap-2.5 text-sm font-medium" :class="disabled ? 'text-stone-400' : 'text-stone-700'">
    <SwitchRoot
      :model-value="modelValue"
      :disabled="disabled"
      :aria-label="label"
      class="relative h-6 w-11 shrink-0 rounded-full bg-stone-300 outline-none transition data-[state=checked]:bg-terracotta-600 focus-visible:ring-2 focus-visible:ring-terracotta-500 focus-visible:ring-offset-2 disabled:opacity-60"
      @update:model-value="value => emit('update:modelValue', value)"
    >
      <SwitchThumb class="block size-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[1.375rem]" />
    </SwitchRoot>
    <span>{{ label }}</span>
  </div>
</template>
