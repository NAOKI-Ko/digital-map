<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { getVisibleCategoryCount } from '~/utils/category-overflow'
import type { SpotCategorySummary } from '~~/shared/types/category'

const props = defineProps<{
  categories: readonly SpotCategorySummary[]
  modelValue: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [categoryIds: string[]]
}>()

const container = ref<HTMLElement | null>(null)
const measurementRow = ref<HTMLElement | null>(null)
const overflowButton = ref<HTMLButtonElement | null>(null)
const overflowMenuId = `category-overflow-${useId()}`
const visibleCategoryCount = ref(props.categories.length)
const overflowOpen = ref(false)
let resizeObserver: ResizeObserver | null = null

const visibleCategories = computed(() => props.categories.slice(0, visibleCategoryCount.value))
const overflowCategories = computed(() => props.categories.slice(visibleCategoryCount.value))
const overflowHasSelection = computed(() => (
  overflowCategories.value.some(category => props.modelValue.includes(category.id))
))

function toggleCategory(categoryId: string, selected: string[]) {
  return selected.includes(categoryId)
    ? selected.filter(id => id !== categoryId)
    : [...selected, categoryId]
}

async function measureCategories() {
  await nextTick()
  const availableWidth = container.value?.clientWidth ?? 0
  const buttons = measurementRow.value?.querySelectorAll<HTMLButtonElement>('button')
  if (!availableWidth || !buttons || buttons.length !== props.categories.length + 2) return

  const widths = Array.from(buttons, button => button.getBoundingClientRect().width)
  visibleCategoryCount.value = getVisibleCategoryCount(
    availableWidth,
    widths[0] ?? 0,
    widths.slice(1, -1),
    widths.at(-1) ?? 0,
    8,
  )
  if (visibleCategoryCount.value === props.categories.length) overflowOpen.value = false
}

function handleDocumentPointerDown(event: PointerEvent) {
  if (event.target instanceof Node && !container.value?.contains(event.target)) {
    overflowOpen.value = false
  }
}

function handleDocumentKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !overflowOpen.value) return
  overflowOpen.value = false
  overflowButton.value?.focus()
}

onMounted(() => {
  resizeObserver = new ResizeObserver(measureCategories)
  if (container.value) resizeObserver.observe(container.value)
  document.addEventListener('pointerdown', handleDocumentPointerDown)
  document.addEventListener('keydown', handleDocumentKeydown)
  measureCategories()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  document.removeEventListener('keydown', handleDocumentKeydown)
})

watch(() => props.categories, measureCategories, { deep: true })
</script>

<template>
  <div
    v-if="categories.length"
    ref="container"
    class="relative flex w-full gap-2"
    role="group"
    aria-label="カテゴリで絞り込み"
  >
    <button
      type="button"
      class="min-h-11 shrink-0 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
      :class="modelValue.length === 0 ? 'bg-stone-900 text-white' : 'bg-white/95 text-stone-700 hover:bg-white'"
      :aria-pressed="modelValue.length === 0"
      @click="$emit('update:modelValue', [])"
    >
      すべて
    </button>
    <button
      v-for="category in visibleCategories"
      :key="category.id"
      type="button"
      class="min-h-11 min-w-11 shrink-0 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
      :class="modelValue.includes(category.id) ? 'bg-terracotta-600 text-white' : 'bg-white/95 text-stone-700 hover:bg-white'"
      :aria-pressed="modelValue.includes(category.id)"
      @click="$emit('update:modelValue', toggleCategory(category.id, modelValue))"
    >
      <span class="flex items-center gap-1.5">
        <CategoryIcon :icon-type="category.iconType" :icon-preset-id="category.iconPresetId" :icon-image-url="category.iconImageUrl" size="sm" />
        <span>{{ category.name }}</span>
      </span>
    </button>

    <div v-if="overflowCategories.length" class="relative shrink-0">
      <button
        ref="overflowButton"
        type="button"
        class="grid size-11 place-items-center rounded-full text-lg font-bold leading-none shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
        :class="overflowHasSelection ? 'bg-terracotta-600 text-white' : 'bg-white/95 text-stone-700 hover:bg-white'"
        aria-label="その他のカテゴリー"
        :aria-controls="overflowMenuId"
        :aria-expanded="overflowOpen"
        :aria-pressed="overflowHasSelection"
        @click="overflowOpen = !overflowOpen"
      >
        …
      </button>
      <div
        v-if="overflowOpen"
        :id="overflowMenuId"
        class="absolute bottom-full right-0 mb-2 max-h-[min(18rem,50svh)] min-w-48 overflow-y-auto rounded-2xl border border-stone-200 bg-white p-2 shadow-xl"
        role="group"
        aria-label="その他のカテゴリー"
      >
        <button
          v-for="category in overflowCategories"
          :key="category.id"
          type="button"
          class="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-stone-700 hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-stone-900"
          :aria-pressed="modelValue.includes(category.id)"
          @click="emit('update:modelValue', toggleCategory(category.id, modelValue))"
        >
          <span class="flex items-center gap-2">
            <CategoryIcon :icon-type="category.iconType" :icon-preset-id="category.iconPresetId" :icon-image-url="category.iconImageUrl" />
            <span>{{ category.name }}</span>
          </span>
          <span v-if="modelValue.includes(category.id)" aria-hidden="true" class="text-terracotta-600">✓</span>
        </button>
      </div>
    </div>

    <div
      ref="measurementRow"
      aria-hidden="true"
      class="pointer-events-none fixed left-0 top-0 -z-50 flex invisible gap-2 whitespace-nowrap"
    >
      <button type="button" tabindex="-1" class="min-h-11 rounded-full px-4 py-2 text-sm font-semibold">すべて</button>
      <button v-for="category in categories" :key="category.id" type="button" tabindex="-1" class="flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold">
        <CategoryIcon :icon-type="category.iconType" :icon-preset-id="category.iconPresetId" :icon-image-url="category.iconImageUrl" size="sm" />
        <span>{{ category.name }}</span>
      </button>
      <button type="button" tabindex="-1" class="size-11 rounded-full text-lg font-bold">…</button>
    </div>
  </div>
</template>
