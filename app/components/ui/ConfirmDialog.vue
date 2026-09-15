<script setup lang="ts">
import UiAlertDialog from './UiAlertDialog.vue'

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
  <UiAlertDialog :open="open" :title="title" :message="message" :confirm-label="confirmLabel" :cancel-label="cancelLabel" :destructive="destructive" :busy="busy" @cancel="cancel" @confirm="emit('confirm')" />
</template>
