<script setup lang="ts">
const { toasts, dismiss } = useToast()
const timers = new Map<string, ReturnType<typeof setTimeout>>()

function schedule(id: string, duration: number) {
  const previous = timers.get(id)
  if (previous) clearTimeout(previous)
  timers.set(id, setTimeout(() => {
    dismiss(id)
    timers.delete(id)
  }, duration))
}

watch(toasts, (messages) => {
  const liveIds = new Set(messages.map(message => message.id))
  for (const [id, timer] of timers) {
    if (!liveIds.has(id)) {
      clearTimeout(timer)
      timers.delete(id)
    }
  }
  for (const message of messages) if (!timers.has(message.id)) schedule(message.id, message.duration)
}, { deep: true, immediate: true })

function pause(id: string) {
  const timer = timers.get(id)
  if (timer) clearTimeout(timer)
  timers.delete(id)
}

function resume(id: string, duration: number) {
  schedule(id, duration)
}

onBeforeUnmount(() => {
  for (const timer of timers.values()) clearTimeout(timer)
  timers.clear()
})
</script>

<template>
  <Teleport to="body">
    <div aria-label="通知" class="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-end gap-2 sm:left-auto sm:w-96">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :role="toast.tone === 'error' ? 'alert' : 'status'"
          :aria-live="toast.tone === 'error' ? 'assertive' : 'polite'"
          class="pointer-events-auto flex w-full items-start gap-3 rounded-xl border bg-white px-4 py-3 text-sm shadow-xl"
          :class="toast.tone === 'error' ? 'border-red-200 text-red-900' : 'border-stone-200 text-stone-900'"
          @mouseenter="pause(toast.id)"
          @mouseleave="resume(toast.id, toast.duration)"
          @focusin="pause(toast.id)"
          @focusout="resume(toast.id, toast.duration)"
        >
          <span aria-hidden="true" :class="toast.tone === 'error' ? 'text-red-600' : 'text-terracotta-600'">{{ toast.tone === 'error' ? '!' : '✓' }}</span>
          <span class="min-w-0 flex-1 leading-6">{{ toast.message }}</span>
          <button type="button" class="dm-field-focus -m-1 min-h-8 min-w-8 rounded p-1 text-stone-500 hover:bg-stone-100" :aria-label="`${toast.message}を閉じる`" @click="dismiss(toast.id)">×</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: opacity 150ms ease, transform 150ms ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-0.5rem); }
@media (prefers-reduced-motion: reduce) { .toast-enter-active, .toast-leave-active { transition: none; } }
</style>
