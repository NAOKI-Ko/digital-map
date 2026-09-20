<script setup lang="ts">
import type { AdminSpotSummary } from '~~/shared/types/spot'

const props = withDefaults(defineProps<{
  spots: AdminSpotSummary[]
  modelValue: string
  label?: string
  inputId?: string
  placeholder?: string
  emptyMessage?: string
}>(), {
  label: '未配置スポット',
  inputId: 'unpositioned-spot-search',
  placeholder: '名前・カテゴリーで検索',
  emptyMessage: '該当する未配置スポットはありません。',
})
const emit = defineEmits<{ 'update:modelValue': [spotId: string] }>()

const root = useTemplateRef<HTMLDivElement>('root')
const query = ref('')
const open = ref(false)
const activeIndex = ref(0)
const selectedSpot = computed(() => props.spots.find(spot => spot.id === props.modelValue) ?? null)
const filteredSpots = computed(() => {
  const keyword = query.value.trim().toLocaleLowerCase('ja')
  if (!keyword) return props.spots
  return props.spots.filter((spot) => [spot.name, spot.floorName, ...spot.categories.map(category => category.name)]
    .some(value => value.toLocaleLowerCase('ja').includes(keyword)))
})
const activeSpot = computed(() => filteredSpots.value[activeIndex.value] ?? null)
const optionsId = computed(() => `${props.inputId}-options`)

watch(() => props.modelValue, () => {
  query.value = selectedSpot.value?.name ?? ''
})

watch(filteredSpots, () => {
  activeIndex.value = 0
})

function selectSpot(spot: AdminSpotSummary) {
  emit('update:modelValue', spot.id)
  query.value = spot.name
  open.value = false
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    open.value = false
    query.value = selectedSpot.value?.name ?? ''
    return
  }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    open.value = true
    const direction = event.key === 'ArrowDown' ? 1 : -1
    activeIndex.value = Math.max(0, Math.min(filteredSpots.value.length - 1, activeIndex.value + direction))
    return
  }
  if (event.key === 'Enter' && open.value) {
    event.preventDefault()
    const spot = filteredSpots.value[activeIndex.value]
    if (spot) selectSpot(spot)
  }
}

function handleFocusOut(event: FocusEvent) {
  if (event.relatedTarget instanceof Node && root.value?.contains(event.relatedTarget)) return
  open.value = false
  query.value = selectedSpot.value?.name ?? ''
}
</script>

<template>
  <div ref="root" class="relative" @focusout="handleFocusOut">
    <label :for="inputId" class="text-sm font-bold text-stone-900">{{ label }}</label>
    <input
      :id="inputId"
      v-model="query"
      role="combobox"
      aria-autocomplete="list"
      :aria-controls="optionsId"
      :aria-expanded="open"
      :aria-activedescendant="open && activeSpot ? `${inputId}-${activeSpot.id}` : undefined"
      autocomplete="off"
      class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm"
      :placeholder="placeholder"
      @focus="open = true"
      @input="open = true"
      @keydown="handleKeydown"
    >
    <ul v-if="open" :id="optionsId" role="listbox" class="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-stone-200 bg-white p-1 shadow-lg">
      <li
        v-for="(spot, index) in filteredSpots"
        :id="`${inputId}-${spot.id}`"
        :key="spot.id"
        role="option"
        :aria-selected="spot.id === modelValue"
      >
        <button type="button" class="w-full rounded-md px-3 py-2 text-left hover:bg-stone-100" :class="index === activeIndex ? 'bg-stone-100' : ''" @mouseenter="activeIndex = index" @click="selectSpot(spot)">
          <span class="block text-sm font-semibold text-stone-900">{{ spot.name }}</span>
          <span class="block text-xs text-stone-500">{{ [spot.floorName, spot.categories.map(category => category.name).join('・')].filter(Boolean).join(' / ') }}</span>
        </button>
      </li>
      <li v-if="filteredSpots.length === 0" class="px-3 py-4 text-center text-sm text-stone-500">{{ emptyMessage }}</li>
    </ul>
  </div>
</template>
