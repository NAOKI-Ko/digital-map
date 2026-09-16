<script setup lang="ts">
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
import { useBottomSheetGesture, type BottomSheetState } from '~/composables/useBottomSheetGesture'
import type { PublicSpot } from '~~/shared/types/public-map'

const props = defineProps<{ spot: PublicSpot }>()
const emit = defineEmits<{ close: [source?: 'pointer' | 'other'], expandedChange: [expanded: boolean] }>()

const sheetState = ref<BottomSheetState>('detail')
const scrollBody = useTemplateRef<HTMLElement>('scrollBody')
const visibleHeight = ref(0)
const visibleBottom = ref(0)

const sheetHeight = computed(() => {
  const height = visibleHeight.value || (import.meta.client ? window.innerHeight : 800)
  return Math.round(height * (sheetState.value === 'expanded' ? 0.92 : 0.6))
})
const viewportStyle = computed(() => ({
  '--spot-sheet-height': `${sheetHeight.value}px`,
  '--spot-sheet-visible-bottom': `${visibleBottom.value}px`,
}))

function updateViewport() {
  const viewport = window.visualViewport
  const height = viewport?.height ?? window.innerHeight
  const offsetTop = viewport?.offsetTop ?? 0
  visibleHeight.value = height
  visibleBottom.value = Math.max(0, window.innerHeight - offsetTop - height)
  if (height < 500) sheetState.value = 'expanded'
}

function setExpanded(expanded: boolean) {
  sheetState.value = expanded ? 'expanded' : 'detail'
}

function requestClose(source: 'pointer' | 'other' = 'other') {
  emit('close', source)
}

const gesture = useBottomSheetGesture({
  state: readonly(sheetState),
  onClose: () => requestClose('other'),
  onExpand: () => setExpanded(true),
})
const sheetMotionStyle = gesture.style

function focusHeading(event: Event) {
  event.preventDefault()
  document.getElementById(`spot-detail-title-${props.spot.id}`)?.focus({ preventScroll: true })
}

function preventAutomaticCloseFocus(event: Event) {
  event.preventDefault()
}

function handlePointerDismiss(event: Event) {
  event.preventDefault()
  requestClose('pointer')
}

function handleKeyboardDismiss(event: Event) {
  event.preventDefault()
  requestClose('other')
}

function addBodyTouchMoveListener() {
  scrollBody.value?.addEventListener('touchmove', gesture.onBodyTouchMove, { passive: false })
}

function removeBodyTouchMoveListener() {
  scrollBody.value?.removeEventListener('touchmove', gesture.onBodyTouchMove)
}

watch(() => props.spot.id, () => {
  sheetState.value = visibleHeight.value < 500 ? 'expanded' : 'detail'
  nextTick(() => scrollBody.value?.scrollTo({ top: 0 }))
})
watch(sheetState, state => emit('expandedChange', state === 'expanded'), { immediate: true })

onMounted(() => {
  updateViewport()
  addBodyTouchMoveListener()
  window.addEventListener('resize', updateViewport)
  window.visualViewport?.addEventListener('resize', updateViewport)
  window.visualViewport?.addEventListener('scroll', updateViewport)
})
onBeforeUnmount(() => {
  removeBodyTouchMoveListener()
  window.removeEventListener('resize', updateViewport)
  window.visualViewport?.removeEventListener('resize', updateViewport)
  window.visualViewport?.removeEventListener('scroll', updateViewport)
})
</script>

<template>
  <DialogRoot :open="true">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-black/[0.14]" />
      <DialogContent
        class="spot-detail-sheet fixed inset-x-0 z-50 flex min-h-0 w-full flex-col overflow-hidden rounded-t-[20px] bg-white shadow-xl outline-none transition-transform ease-out"
        :style="[viewportStyle, sheetMotionStyle]"
        :aria-describedby="undefined"
        aria-modal="true"
        @open-auto-focus="focusHeading"
        @close-auto-focus="preventAutomaticCloseFocus"
        @escape-key-down="handleKeyboardDismiss"
        @pointer-down-outside="handlePointerDismiss"
      >
        <header
          class="spot-detail-sheet__drag-region shrink-0 border-b border-stone-100 px-4"
          @pointerdown="gesture.onHeaderPointerDown"
          @pointermove="gesture.onHeaderPointerMove"
          @pointerup="gesture.onHeaderPointerUp"
          @pointercancel="gesture.onHeaderPointerCancel"
        >
          <div class="flex h-7 items-center justify-center" aria-hidden="true"><span class="h-1 w-9 rounded-full bg-stone-300" /></div>
          <div class="flex min-h-14 items-start gap-2 pb-3">
            <div class="min-w-0 flex-1">
              <div v-if="spot.categories.length" class="flex flex-wrap gap-1.5">
                <span v-for="category in spot.categories" :key="category.id" class="rounded-full bg-terracotta-50 px-2 py-1 text-xs font-semibold text-terracotta-700">{{ category.name }}</span>
              </div>
              <DialogTitle :id="`spot-detail-title-${spot.id}`" tabindex="-1" class="mt-1 text-[22px] font-bold leading-tight tracking-tight text-stone-900 outline-none">
                {{ spot.name }}
              </DialogTitle>
            </div>
            <button type="button" class="grid size-11 shrink-0 place-items-center rounded-full text-lg text-stone-700 hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 md:hidden" :aria-label="sheetState === 'expanded' ? 'スポット詳細の高さを戻す' : 'スポット詳細を大きく表示'" @click="setExpanded(sheetState !== 'expanded')">
              <span aria-hidden="true">{{ sheetState === 'expanded' ? '⌄' : '⌃' }}</span>
            </button>
            <button type="button" class="grid size-11 shrink-0 place-items-center rounded-full bg-stone-100 text-xl leading-none text-stone-700 hover:bg-stone-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900" aria-label="スポット詳細を閉じる" @click="requestClose('other')">×</button>
          </div>
        </header>

        <div ref="scrollBody" class="spot-detail-sheet__body min-h-0 flex-1 overflow-y-auto overscroll-contain" @touchstart="gesture.onBodyTouchStart" @touchend="gesture.onBodyTouchEnd" @touchcancel="gesture.onBodyTouchCancel">
          <div v-if="spot.photos.length" class="flex snap-x snap-mandatory overflow-x-auto bg-stone-100" data-sheet-no-drag>
            <img v-for="(photo, index) in spot.photos" :key="photo" :src="photo" :alt="`${spot.name}の写真${index + 1}`" class="h-52 w-full shrink-0 snap-center object-cover md:h-64">
          </div>
          <div class="px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 md:p-6">
            <p v-if="spot.description" class="whitespace-pre-line text-sm leading-7 text-stone-700">{{ spot.description }}</p>
            <p v-else class="text-sm text-stone-500">説明は登録されていません。</p>
            <dl v-if="spot.informationFields.length" class="mt-6 divide-y divide-stone-200 border-y border-stone-200 text-sm">
              <div v-for="field in spot.informationFields" :key="field.id" class="grid grid-cols-[5.5rem_1fr] gap-3 py-3">
                <dt class="font-semibold text-stone-500">{{ field.label }}</dt>
                <dd class="min-w-0 whitespace-pre-line text-stone-800">
                  <a v-if="field.href" :href="field.href" class="break-words font-semibold text-terracotta-700 underline decoration-terracotta-300 underline-offset-4" :target="field.type === 'url' ? '_blank' : undefined" :rel="field.type === 'url' ? 'noopener noreferrer' : undefined">{{ field.value }}</a>
                  <template v-else>{{ field.value }}</template>
                </dd>
              </div>
            </dl>
            <a v-if="spot.websiteAction" :href="spot.websiteAction.url" target="_blank" rel="noopener noreferrer" class="mt-5 inline-flex min-h-11 items-center rounded-lg bg-terracotta-600 px-4 py-2.5 text-sm font-semibold text-white">{{ spot.websiteAction.label }}を見る</a>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
.spot-detail-sheet {
  bottom: var(--spot-sheet-visible-bottom, 0px);
  height: var(--spot-sheet-height, 60dvh);
  --sheet-motion-duration: 180ms;
}

.spot-detail-sheet__drag-region {
  touch-action: none;
  user-select: none;
}

.spot-detail-sheet__drag-region button {
  touch-action: manipulation;
}

.spot-detail-sheet__body {
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;
}

@media (min-width: 768px) {
  .spot-detail-sheet {
    inset: 50% 1.25rem auto auto;
    width: min(32rem, calc(100vw - 2.5rem));
    height: min(52rem, calc(100dvh - 2.5rem));
    max-height: calc(100dvh - 2.5rem);
    transform: translate3d(0, -50%, 0) !important;
    border-radius: 1.5rem;
  }

  .spot-detail-sheet__drag-region {
    touch-action: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spot-detail-sheet { --sheet-motion-duration: 0ms; }
}
</style>
