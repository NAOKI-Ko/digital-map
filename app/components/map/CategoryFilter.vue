<script setup lang="ts">
import type { SpotCategorySummary } from '~~/shared/types/category'
import { nextCategoryScrollLeft } from '~/utils/category-scroll'

const props = defineProps<{ categories: readonly SpotCategorySummary[], modelValue: string[], counts?: Readonly<Record<string, number>>, facilityOverviewAvailable?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [categoryIds: string[]], facilityOverview: [] }>()
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
function scrollCategories() {
  const el = scroller.value
  if (!el) return
  el.scrollTo({ left: nextCategoryScrollLeft(el, canForward.value), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
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
watch(() => props.categories, () => nextTick(() => {
  observer?.disconnect()
  if (scroller.value) observer?.observe(scroller.value)
  scroller.value?.scrollTo({ left: 0 })
  measure()
}))
</script>

<template>
  <div v-if="categories.length" class="category-filter min-w-0" role="group" aria-label="カテゴリで絞り込み（複数選択可・いずれかに一致）">
    <div class="category-mobile-heading"><span>カテゴリー</span><span>複数選択可 · いずれかに一致</span></div>
    <div class="category-filter-options flex min-w-0 items-center gap-2">
    <button type="button" class="category-mobile-clear visitor-control flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-white/70 px-3 text-sm font-semibold shadow-sm backdrop-blur" :class="modelValue.length === 0 ? 'bg-stone-900 text-white' : 'bg-white/95 text-stone-800'" :aria-pressed="modelValue.length === 0" title="選んだいずれかのカテゴリーに一致するスポットを表示します" :aria-label="modelValue.length ? 'カテゴリの絞り込みを解除' : 'すべてのカテゴリを表示'" @click="emit('update:modelValue', [])">
      <span class="lg:hidden">{{ modelValue.length ? 'クリア' : 'すべて' }}</span>
      <span class="hidden flex-col items-center leading-tight lg:flex">
        <span class="text-[10px] font-medium">カテゴリー · 複数選択可</span>
        <span class="mt-0.5">{{ modelValue.length ? `クリア (${modelValue.length})` : 'すべて' }}</span>
      </span>
    </button>
    <button v-if="facilityOverviewAvailable" type="button" class="visitor-control flex h-11 shrink-0 flex-col items-center justify-center rounded-full border border-white/70 bg-white/95 px-3 text-xs font-semibold leading-tight text-stone-800 shadow-sm md:hidden" aria-label="設備を全体で見る" @click="emit('facilityOverview')"><span>設備を</span><span>全体で見る</span></button>
    <div class="category-list-frame relative min-w-0 flex-1">
      <div ref="scroller" class="category-chip-scroller flex min-w-0 gap-2 overflow-x-auto overscroll-x-contain py-1" @scroll="measure" @focusin="reveal">
        <button v-for="category in categories" :key="category.id" type="button" class="category-item visitor-control flex min-h-11 min-w-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/70 px-3 text-sm font-semibold shadow-sm backdrop-blur" :class="modelValue.includes(category.id) ? 'bg-terracotta-600 text-white' : 'bg-white/95 text-stone-700 hover:bg-white'" :aria-pressed="modelValue.includes(category.id)" :title="category.name" @click="toggleCategory(category.id)">
          <span class="category-check" aria-hidden="true">{{ modelValue.includes(category.id) ? '✓' : '' }}</span>
          <CategoryIcon :icon-type="category.iconType" :icon-preset-id="category.iconPresetId" :icon-image-url="category.iconImageUrl" size="sm" />
          <span class="category-label">{{ category.name }}</span>
          <span v-if="counts" class="category-count">{{ counts[category.id] ?? 0 }}</span>
        </button>
      </div>
      <span v-if="canBack" class="pointer-events-none absolute inset-y-1 left-0 w-4 rounded-l-full bg-gradient-to-r from-stone-100/90 to-transparent" aria-hidden="true" />
      <span v-if="canForward" class="pointer-events-none absolute inset-y-1 right-0 w-4 rounded-r-full bg-gradient-to-l from-stone-100/90 to-transparent" aria-hidden="true" />
    </div>
    <button v-if="canBack || canForward" type="button" class="category-scroll-button visitor-control grid size-11 shrink-0 place-items-center rounded-full border border-white/70 bg-white/95 text-lg text-stone-700 shadow-sm" :aria-label="canForward ? '次のカテゴリを表示' : '先頭のカテゴリへ戻る'" @click="scrollCategories"><span aria-hidden="true">{{ canForward ? '›' : '‹' }}</span></button>
    </div>
    <p class="sr-only hidden lg:block" role="status">{{ modelValue.length ? `選択中 ${modelValue.length}カテゴリ` : 'すべて表示' }}</p>
  </div>
</template>

<style scoped>
.category-mobile-heading { display: flex; align-items: baseline; flex-wrap: wrap; justify-content: space-between; gap: .5rem; margin-bottom: .125rem; padding: .125rem .25rem; font-size: .6875rem; font-weight: 600; color: #44403c; }
.category-mobile-heading span { padding: .125rem .375rem; border-radius: .5rem; background: rgb(255 255 255 / 94%); }
.category-check { display: inline-grid; place-items: center; width: .875rem; height: .875rem; flex: none; border: 1px solid currentColor; border-radius: .25rem; font-size: .6875rem; line-height: 1; }
.category-count { flex: none; font-size: .75rem; font-variant-numeric: tabular-nums; opacity: .85; }
/* The white separation keeps amber visible on the selected green surface.
   Paint stays inside the scroll viewport and the existing 52px desktop band. */
.category-filter button:focus-visible {
  outline: 2px solid var(--visitor-focus, #b45309);
  outline-offset: -4px;
  box-shadow: inset 0 0 0 6px white;
}
.category-item { gap: .25rem; padding-inline: .625rem; }
.category-filter .category-mobile-heading { color: var(--visitor-muted, #52635e); }
.category-mobile-heading span { background: var(--visitor-surface, white); }
.category-label { max-width: 15rem; overflow: hidden; text-overflow: ellipsis; }

.category-chip-scroller {
  scrollbar-width: thin;
  scrollbar-color: #a8a29e transparent;
  scroll-padding-inline: 1rem;
}
.category-chip-scroller::-webkit-scrollbar { height: 3px; }
.category-chip-scroller::-webkit-scrollbar-thumb { background: #a8a29e; border-radius: 999px; }
/* Keep the desktop dock inside its existing 52px reserved band. */
@screen lg {
  .category-mobile-heading { display: none; }
  .category-filter-options, .category-chip-scroller { height: 52px; }
  .category-chip-scroller { box-sizing: border-box; scrollbar-width: none; }
  .category-chip-scroller::-webkit-scrollbar { display: none; }
}
</style>
