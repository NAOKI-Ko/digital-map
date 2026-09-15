<script setup lang="ts">
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
} from 'reka-ui'

const props = withDefaults(defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  secondaryLabel?: string
  destructive?: boolean
  busy?: boolean
}>(), {
  confirmLabel: '実行する',
  cancelLabel: 'キャンセル',
  secondaryLabel: '',
  destructive: false,
  busy: false,
})

const emit = defineEmits<{ confirm: [], cancel: [], secondary: [] }>()
let closeHandledByButton = false

function handleOpenChange(value: boolean) {
  if (!value && !props.busy && !closeHandledByButton) emit('cancel')
  closeHandledByButton = false
}

function markCloseHandled() {
  closeHandledByButton = true
}

function emitCancelAction() {
  emit('cancel')
}

function emitConfirmAction() {
  emit('confirm')
}
</script>

<template>
  <AlertDialogRoot :open="open" @update:open="handleOpenChange">
    <AlertDialogPortal>
      <AlertDialogOverlay class="fixed inset-0 z-[70] bg-stone-950/60" />
      <AlertDialogContent class="fixed left-1/2 top-1/2 z-[71] max-h-[calc(100svh-2rem)] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl outline-none sm:p-6">
        <AlertDialogTitle class="text-xl font-bold text-stone-900">{{ title }}</AlertDialogTitle>
        <AlertDialogDescription class="mt-2 text-sm leading-6 text-stone-600">{{ message }}</AlertDialogDescription>
        <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AlertDialogCancel as-child>
            <button type="button" :disabled="busy" class="rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 disabled:opacity-50" @click.capture="markCloseHandled" @click="emitCancelAction">{{ cancelLabel }}</button>
          </AlertDialogCancel>
          <button v-if="secondaryLabel" type="button" :disabled="busy" class="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-50" @click="emit('secondary')">{{ secondaryLabel }}</button>
          <AlertDialogAction as-child>
            <button type="button" :disabled="busy" class="rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" :class="destructive ? 'bg-red-700' : 'bg-terracotta-600'" @click.capture="markCloseHandled" @click="emitConfirmAction">{{ busy ? '処理中…' : confirmLabel }}</button>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
