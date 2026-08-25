<script setup lang="ts">
import AppDialog from './AppDialog.vue'

const props = withDefaults(defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  busy?: boolean
}>(), {
  confirmLabel: '実行する',
  cancelLabel: 'キャンセル',
  destructive: false,
  busy: false,
})

const emit = defineEmits<{ confirm: [], cancel: [] }>()

function cancel() {
  if (!props.busy) emit('cancel')
}
</script>

<template>
  <AppDialog :open="open" :title="title" :description="message" max-width="sm" @close="cancel">
    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button type="button" :disabled="busy" class="rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50" @click="cancel">{{ cancelLabel }}</button>
      <button type="button" :disabled="busy" class="rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" :class="destructive ? 'bg-red-700 hover:bg-red-800' : 'bg-terracotta-600 hover:bg-terracotta-700'" @click="emit('confirm')">{{ busy ? '処理中…' : confirmLabel }}</button>
    </div>
  </AppDialog>
</template>
