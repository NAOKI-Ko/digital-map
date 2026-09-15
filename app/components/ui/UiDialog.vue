<script setup lang="ts">
import { DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'

const props = withDefaults(defineProps<{
  open: boolean
  title: string
  description?: string
  maxWidth?: 'sm' | 'md' | 'lg'
}>(), { description: '', maxWidth: 'md' })

const emit = defineEmits<{ close: [] }>()
const maxWidthClass = computed(() => ({ sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl' })[props.maxWidth])
</script>

<template>
  <DialogRoot :open="open" @update:open="value => { if (!value) emit('close') }">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-[60] bg-stone-950/60 data-[state=open]:animate-in data-[state=closed]:animate-out" />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-[61] max-h-[calc(100svh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl outline-none sm:p-6"
        :class="maxWidthClass"
      >
        <DialogTitle class="text-xl font-bold tracking-tight text-stone-900">{{ title }}</DialogTitle>
        <DialogDescription v-if="description" class="mt-2 text-sm leading-6 text-stone-600">{{ description }}</DialogDescription>
        <div class="mt-5"><slot /></div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
