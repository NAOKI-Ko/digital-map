<script setup lang="ts">
const props = withDefaults(defineProps<{
  storageKey: string
  duration?: number
  suppressed?: boolean
  overviewSuggested?: boolean
}>(), {
  duration: 4200,
  suppressed: false,
  overviewSuggested: false,
})

const visible = ref(false)
const overviewMode = ref(false)
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

watch(() => props.overviewSuggested, suggested => {
  if (!suggested) {
    if (overviewMode.value) visible.value = false
    return
  }
  if (timer) clearTimeout(timer)
  overviewMode.value = true
  visible.value = true
  timer = setTimeout(() => { visible.value = false }, props.duration)
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <Transition name="map-hint">
    <div
      v-if="visible && !suppressed"
      class="visitor-operation-hint pointer-events-none absolute inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+var(--visitor-category-height,52px)+6rem)] z-30 mx-auto max-w-sm rounded-2xl bg-stone-950/85 px-4 py-3 text-center text-sm font-medium leading-6 text-white shadow-xl backdrop-blur sm:bottom-8"
      :class="{ 'visitor-operation-hint--overview': overviewMode }"
      role="status"
    >
      <p class="font-bold">{{ overviewMode ? '全体で画面に合わせられます' : 'マップを自由に動かせます' }}</p>
      <p v-if="!overviewMode" class="mt-1 text-xs text-stone-200 sm:text-sm">ドラッグで移動、2本指で回転・傾き、ピンチで拡大縮小できます。</p>
    </div>
  </Transition>
</template>

<style scoped>
.visitor-operation-hint--overview { bottom: calc(env(safe-area-inset-bottom) + var(--visitor-category-height,52px) + 6rem); }
.visitor-operation-hint { background: rgb(32 52 44 / 94%); }

.map-hint-enter-active,
.map-hint-leave-active {
  transition: opacity 500ms ease, transform 500ms ease;
}

.map-hint-enter-from,
.map-hint-leave-to {
  opacity: 0;
  transform: translateY(0.75rem);
}

@media (prefers-reduced-motion: reduce) {
  .map-hint-enter-active, .map-hint-leave-active { transition: none; }
  .map-hint-enter-from, .map-hint-leave-to { transform: none; }
}
</style>
