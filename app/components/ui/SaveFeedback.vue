<script setup lang="ts">
const props = withDefaults(defineProps<{
  state: 'idle' | 'saving' | 'success' | 'error'
  message?: string
}>(), { message: '' })

const text = computed(() => props.message || ({
  idle: '',
  saving: '保存しています…',
  success: '保存しました。',
  error: '保存できませんでした。もう一度お試しください。',
})[props.state])
const toastKey = useId()
const { success } = useToast()

watch([() => props.state, text], ([state, message]) => {
  if (state === 'success' && message) success(message, toastKey)
}, { immediate: true })
</script>

<template>
  <p
    v-if="state === 'saving' || state === 'error'"
    :role="state === 'error' ? 'alert' : 'status'"
    :aria-live="state === 'error' ? 'assertive' : 'polite'"
    class="rounded-lg border px-4 py-3 text-sm"
    :class="{
      'border-stone-200 bg-stone-50 text-stone-700': state === 'saving',
      'border-red-200 bg-red-50 text-red-700': state === 'error',
    }"
  >
    {{ text }}
  </p>
</template>
