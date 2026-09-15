<script setup lang="ts">
import UiDialog from './UiDialog.vue'

withDefaults(defineProps<{
  open: boolean
  title: string
  description?: string
  maxWidth?: 'sm' | 'md' | 'lg'
}>(), {
  description: '',
  maxWidth: 'md',
})

const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <UiDialog :open="open" :title="title" :description="description" :max-width="maxWidth" @close="emit('close')">
    <slot />
  </UiDialog>
</template>
