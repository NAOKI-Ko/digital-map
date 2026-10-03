<script setup lang="ts">
import type { SpotCategorySummary } from '~~/shared/types/category'

const props = defineProps<{ categories: readonly SpotCategorySummary[], modelValue: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [categoryIds: string[]] }>()
const scroller = useTemplateRef<HTMLElement>('scroller')
const overflowing = ref(false)
const canBack = ref(false)
const canForward = ref(false)
let observer: ResizeObserver | null = null
let measureFrame: number | null = null
function scheduleMeasure() {
  if (measureFrame !== null) cancelAnimationFrame(measureFrame)
  measureFrame = requestAnimationFrame(() => { measureFrame = null; measure() })
}
function measure() {
  const el = scroller.value
  overflowing.value = Boolean(el && el.scrollWidth > el.clientWidth + 4)
  canBack.value = Boolean(el && el.scrollLeft > 4)
  canForward.value = Boolean(el && el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
}
function scroll() {
  const el = scroller.value
  if (!el) return
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  if (canForward.value) el.scrollBy({ left: Math.max(120, el.clientWidth * 0.8), behavior })
  else el.scrollTo({ left: 0, behavior })
}
function reveal(event: FocusEvent) {
  ;(event.target as HTMLElement).scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
}
function toggleCategory(categoryId: string) {
  emit('update:modelValue', props.modelValue.includes(categoryId)
    ? props.modelValue.filter(id => id !== categoryId)
    : [...props.modelValue, categoryId])
}
onMounted(() => {
  observer = new ResizeObserver(scheduleMeasure)
  if (scroller.value) observer.observe(scroller.value)
  measure()
})
onBeforeUnmount(() => {
  observer?.disconnect()
  if (measureFrame !== null) cancelAnimationFrame(measureFrame)
})
watch(() => props.categories, () => nextTick(() => { scroller.value?.scrollTo({ left: 0 }); measure() }))
</script>

<template>
  <div v-if="categories.length" class="flex min-w-0 items-center gap-2" role="group" aria-label="カテゴリで絞り込み">
    <button type="button" class="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-white/70 px-3 text-sm font-semibold shadow-sm backdrop-blur" :class="modelValue.length === 0 ? 'bg-stone-900 text-white' : 'bg-white/95 text-stone-800'" :aria-pressed="modelValue.length === 0" :aria-label="modelValue.length ? 'カテゴリの絞り込みを解除' : 'すべてのカテゴリを表示'" @click="emit('update:modelValue', [])">
      {{ modelValue.length ? '解除' : 'すべて' }}
    </button>
    <div class="relative min-w-0 flex-1">
      <div ref="scroller" class="flex min-w-0 gap-2 overflow-x-auto overscroll-x-contain py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" @scroll="measure" @focusin="reveal">
        <button v-for="category in categories" :key="category.id" type="button" class="flex min-h-11 min-w-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/70 px-3 text-sm font-semibold shadow-sm backdrop-blur" :class="modelValue.includes(category.id) ? 'bg-terracotta-600 text-white' : 'bg-white/95 text-stone-700 hover:bg-white'" :aria-pressed="modelValue.includes(category.id)" @click="toggleCategory(category.id)">
          <CategoryIcon :icon-type="category.iconType" :icon-preset-id="category.iconPresetId" :icon-image-url="category.iconImageUrl" size="sm" />
          <span>{{ category.name }}</span>
        </button>
      </div>
      <span v-if="canBack" class="pointer-events-none absolute inset-y-1 left-0 w-3 rounded-l-full bg-gradient-to-r from-stone-100/90 to-transparent" aria-hidden="true" />
      <span v-if="canForward" class="pointer-events-none absolute inset-y-1 right-0 w-3 rounded-r-full bg-gradient-to-l from-stone-100/90 to-transparent" aria-hidden="true" />
    </div>
    <button v-if="overflowing" type="button" class="grid size-11 shrink-0 place-items-center rounded-full border border-white/70 bg-white/95 text-lg text-stone-900 shadow-sm" :aria-label="canForward ? '次のカテゴリを表示' : '最初のカテゴリへ戻る'" @click="scroll">{{ canForward ? '›' : '‹' }}</button>
  </div>
</template>
