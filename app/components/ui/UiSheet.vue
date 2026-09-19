<script setup lang="ts">
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
withDefaults(defineProps<{ open: boolean, title: string, description?: string, side?: 'bottom' | 'right' }>(), { description: '', side: 'bottom' })
const emit = defineEmits<{ close: [] }>()
</script>
<template>
  <DialogRoot :open="open" @update:open="value => { if (!value) emit('close') }">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-[60] bg-stone-950/45" />
      <DialogContent class="fixed z-[61] flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden bg-white shadow-2xl outline-none" :class="side === 'right' ? 'inset-y-0 right-0 h-full w-[min(28rem,calc(100vw-1rem))] rounded-l-2xl' : 'inset-x-0 bottom-0 rounded-t-3xl'">
        <div class="flex shrink-0 items-start justify-between gap-4 border-b border-stone-200 px-5 py-4">
          <div><DialogTitle class="text-lg font-bold text-stone-950">{{ title }}</DialogTitle><DialogDescription v-if="description" class="mt-1 text-sm text-stone-600">{{ description }}</DialogDescription></div>
          <DialogClose as-child><UiButton variant="icon" aria-label="閉じる" @click="emit('close')">×</UiButton></DialogClose>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"><slot /></div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
