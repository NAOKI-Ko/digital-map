<script setup lang="ts">
const props = withDefaults(defineProps<{
  storageKey: string
  duration?: number
}>(), {
  duration: 4200,
})

const visible = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  try {
    if (sessionStorage.getItem(props.storageKey)) return
    sessionStorage.setItem(props.storageKey, '1')
  }
  catch {
    // ストレージが利用できない環境でも、操作案内そのものは表示する。
  }

  visible.value = true
  timer = setTimeout(() => {
    visible.value = false
  }, props.duration)
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <Transition name="map-hint">
    <div
      v-if="visible"
      class="pointer-events-none absolute inset-x-4 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-30 mx-auto max-w-lg rounded-2xl bg-stone-950/85 px-5 py-4 text-center text-sm font-medium leading-6 text-white shadow-xl backdrop-blur sm:bottom-8"
      role="status"
    >
      <p class="font-bold">マップを自由に動かせます</p>
      <p class="mt-1 text-xs text-stone-200 sm:text-sm">ドラッグで移動、2本指で回転・傾き、ピンチで拡大縮小できます。</p>
    </div>
  </Transition>
</template>

<style scoped>
.map-hint-enter-active,
.map-hint-leave-active {
  transition: opacity 500ms ease, transform 500ms ease;
}

.map-hint-enter-from,
.map-hint-leave-to {
  opacity: 0;
  transform: translateY(0.75rem);
}
</style>
