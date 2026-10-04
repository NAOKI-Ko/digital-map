<script setup lang="ts">
import type { SpotCategorySummary } from '~~/shared/types/category'

const props = defineProps<{ categories: readonly SpotCategorySummary[], modelValue: string[], counts?: Readonly<Record<string, number>> }>()
const emit = defineEmits<{ 'update:modelValue': [categoryIds: string[]] }>()
const scroller = useTemplateRef<HTMLElement>('scroller')
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
  canBack.value = Boolean(el && el.scrollLeft > 4)
  canForward.value = Boolean(el && el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
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
  <div v-if="categories.length" class="category-filter flex min-w-0 items-center gap-2" role="group" aria-label="カテゴリで絞り込み">
    <div class="category-palette-heading hidden"><span>カテゴリー</span><button type="button" :aria-pressed="modelValue.length === 0" @click="emit('update:modelValue', [])">すべて</button></div>
    <button type="button" class="category-mobile-clear flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-white/70 px-3 text-sm font-semibold shadow-sm backdrop-blur" :class="modelValue.length === 0 ? 'bg-stone-900 text-white' : 'bg-white/95 text-stone-800'" :aria-pressed="modelValue.length === 0" :aria-label="modelValue.length ? 'カテゴリの絞り込みを解除' : 'すべてのカテゴリを表示'" @click="emit('update:modelValue', [])">
      {{ modelValue.length ? 'クリア' : 'すべて' }}
    </button>
    <div class="category-list-frame relative min-w-0 flex-1">
      <div ref="scroller" class="category-chip-scroller flex min-w-0 gap-2 overflow-x-auto overscroll-x-contain py-1" @scroll="measure" @focusin="reveal">
        <button v-for="category in categories" :key="category.id" type="button" class="category-item flex min-h-11 min-w-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/70 px-3 text-sm font-semibold shadow-sm backdrop-blur" :class="modelValue.includes(category.id) ? 'bg-terracotta-600 text-white' : 'bg-white/95 text-stone-700 hover:bg-white'" :aria-pressed="modelValue.includes(category.id)" @click="toggleCategory(category.id)">
          <span class="category-check hidden" aria-hidden="true">{{ modelValue.includes(category.id) ? '✓' : '' }}</span>
          <CategoryIcon :icon-type="category.iconType" :icon-preset-id="category.iconPresetId" :icon-image-url="category.iconImageUrl" size="sm" />
          <span class="category-label">{{ category.name }}</span>
          <span v-if="counts" class="category-count hidden">{{ counts[category.id] ?? 0 }}</span>
        </button>
      </div>
      <span v-if="canBack" class="pointer-events-none absolute inset-y-1 lg:hidden left-0 w-4 rounded-l-full bg-gradient-to-r from-stone-100/90 to-transparent" aria-hidden="true" />
      <span v-if="canForward" class="pointer-events-none absolute inset-y-1 lg:hidden right-0 w-4 rounded-r-full bg-gradient-to-l from-stone-100/90 to-transparent" aria-hidden="true" />
    </div>
    <div class="category-palette-footer hidden">
      <span role="status">{{ modelValue.length ? `選択中 ${modelValue.length}件` : 'すべて表示' }}</span>
      <button type="button" :disabled="!modelValue.length" aria-label="カテゴリの絞り込みを解除" @click="emit('update:modelValue', [])">クリア</button>
    </div>
  </div>
</template>

<style scoped>
.category-chip-scroller {
  scrollbar-width: thin;
  scrollbar-color: #a8a29e transparent;
  scroll-padding-inline: 1rem;
}
.category-chip-scroller::-webkit-scrollbar { height: 3px; }
.category-chip-scroller::-webkit-scrollbar-thumb { background: #a8a29e; border-radius: 999px; }
/* Tailwind's existing lg breakpoint; no separate JS viewport state. */
@screen lg {
  .category-filter { display: flex; flex-direction: column; align-items: stretch; gap: 0; width: 15rem; max-height: 50dvh; border: 1px solid rgb(255 255 255 / 85%); border-radius: 1rem; background: rgb(255 255 255 / 94%); box-shadow: 0 4px 18px rgb(28 25 23 / 8%); backdrop-filter: blur(12px); }
  .category-mobile-clear { display: none; }
  .category-palette-heading, .category-palette-footer { display: flex; flex: none; align-items: center; justify-content: space-between; gap: .5rem; padding: .25rem .75rem; }
  .category-palette-heading { font-size: .875rem; font-weight: 700; border-bottom: 1px solid #e7e5e4; }
  .category-palette-footer { border-top: 1px solid #e7e5e4; color: #57534e; font-size: .75rem; }
  .category-palette-heading button, .category-palette-footer button { min-height: 44px; padding: 0 .5rem; border-radius: .5rem; font-weight: 600; }
  .category-palette-heading button[aria-pressed="true"] { color: #a9361c; }
  .category-palette-footer button:disabled { opacity: .45; }
  .category-filter button:focus-visible { outline: 2px solid #b45309; outline-offset: -2px; }
  .category-list-frame { min-height: 0; display: flex; }
  .category-chip-scroller { flex: 1; flex-direction: column; gap: .25rem; overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; padding: .5rem; scroll-padding: .5rem; }
  .category-item { width: 100%; gap: .5rem; padding: .5rem; white-space: normal; border-radius: .625rem; border: 0; box-shadow: none; backdrop-filter: none; background: transparent; text-align: left; }
  .category-item:hover { background: #f5f5f4; }
  .category-item[aria-pressed="true"] { background: #fbe8e3; color: #8c311f; }
  .category-check { display: block; flex: 0 0 .875rem; font-weight: 800; }
  .category-label { flex: 1; min-width: 0; overflow-wrap: anywhere; line-height: 1.4; }
  .category-count { display: block; flex: none; font-size: .75rem; font-variant-numeric: tabular-nums; color: #78716c; }
}
</style>
