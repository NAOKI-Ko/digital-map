<script setup lang="ts">
import type { SpotCategorySummary } from '~~/shared/types/category'

const props = defineProps<{ categories: readonly SpotCategorySummary[], modelValue: string[] }>()
const scroller = useTemplateRef<HTMLElement>('scroller')
const overflowing = ref(false)
const canBack = ref(false)
const canForward = ref(false)
let observer: ResizeObserver | null = null
function measure() {
  const el = scroller.value
  overflowing.value = Boolean(el && el.scrollWidth > el.clientWidth + 4)
  canBack.value = Boolean(el && el.scrollLeft > 4)
  canForward.value = Boolean(el && el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
}
function scroll(direction: number) {
  scroller.value?.scrollBy({ left: direction * Math.max(120, scroller.value.clientWidth * 0.7), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
}
onMounted(() => { observer = new ResizeObserver(measure); if (scroller.value) observer.observe(scroller.value); measure() })
onBeforeUnmount(() => observer?.disconnect())
watch(() => props.categories, () => nextTick(() => { scroller.value?.scrollTo({ left: 0 }); measure() }))

const emit = defineEmits<{ 'update:modelValue': [categoryIds: string[]] }>()

function toggleCategory(categoryId: string) {
  emit('update:modelValue', props.modelValue.includes(categoryId)
    ? props.modelValue.filter(id => id !== categoryId)
    : [...props.modelValue, categoryId])
}
</script>

<template>
  <div v-if="categories.length" class="flex min-w-0 items-center gap-1">
    <button v-if="overflowing" :disabled="!canBack" type="button" class="grid size-11 shrink-0 place-items-center rounded-full bg-white text-stone-900 shadow-sm disabled:opacity-40" aria-label="前のカテゴリを表示" @click="scroll(-1)">‹</button>
  <div ref="scroller" @scroll="measure" class="flex min-w-0 flex-1 snap-x gap-2 overflow-x-auto overscroll-x-contain px-0.5 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="カテゴリで絞り込み">
    <button type="button" class="grid min-h-11 shrink-0 snap-start place-items-center rounded-full py-1 text-sm font-semibold" :aria-pressed="modelValue.length === 0" @click="emit('update:modelValue', [])">
      <span class="flex h-8 items-center rounded-full px-3 shadow-sm backdrop-blur transition" :class="modelValue.length === 0 ? 'bg-stone-900 text-white' : 'bg-white/85 text-stone-700 hover:bg-white'">すべて</span>
    </button>
    <button v-for="category in categories" :key="category.id" type="button" class="grid min-h-11 min-w-11 shrink-0 snap-start place-items-center rounded-full py-1 text-sm font-semibold" :aria-pressed="modelValue.includes(category.id)" @click="toggleCategory(category.id)">
      <span class="flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-3 shadow-sm backdrop-blur transition" :class="modelValue.includes(category.id) ? 'bg-terracotta-600 text-white' : 'bg-white/85 text-stone-700 hover:bg-white'"><CategoryIcon :icon-type="category.iconType" :icon-preset-id="category.iconPresetId" :icon-image-url="category.iconImageUrl" size="sm" /><span>{{ category.name }}</span></span>
    </button>
  </div>
    <button v-if="overflowing" :disabled="!canForward" type="button" class="grid size-11 shrink-0 place-items-center rounded-full bg-white text-stone-900 shadow-sm disabled:opacity-40" aria-label="次のカテゴリを表示" @click="scroll(1)">›</button>
  </div>
</template>
