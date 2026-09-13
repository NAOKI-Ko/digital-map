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
</script>

<template>
  <p
    v-if="state !== 'idle'"
    :role="state === 'error' ? 'alert' : 'status'"
    :aria-live="state === 'error' ? 'assertive' : 'polite'"
    class="rounded-lg border px-4 py-3 text-sm"
    :class="{
      'border-stone-200 bg-stone-50 text-stone-700': state === 'saving',
      'border-emerald-200 bg-emerald-50 text-emerald-700': state === 'success',
      'border-red-200 bg-red-50 text-red-700': state === 'error',
    }"
  >
    {{ text }}
  </p>
</template>
