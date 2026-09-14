<script setup lang="ts">
import type { PublicFloor } from '~~/shared/types/public-map'

const props = defineProps<{
  floors: readonly PublicFloor[]
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [floorId: string]
}>()
const buttons = ref<HTMLButtonElement[]>([])
function handleKeydown(event: KeyboardEvent, index: number) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? props.floors.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + props.floors.length) % props.floors.length
  const floor = props.floors[next]
  if (floor) emit('update:modelValue', floor.id)
  nextTick(() => buttons.value[next]?.focus())
}
</script>

<template>
  <div
    v-if="floors.length > 1"
    class="flex max-w-full overscroll-x-contain gap-2 overflow-x-auto px-1 pb-1"
    role="tablist"
    aria-label="フロアを切り替え"
  >
    <button
      ref="buttons"
      v-for="floor in floors"
      :key="floor.id"
      type="button"
      role="tab"
      class="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition"
      :class="modelValue === floor.id ? 'bg-terracotta-600 text-white' : 'bg-white/95 text-stone-700 hover:bg-white'"
      :aria-selected="modelValue === floor.id"
      :tabindex="modelValue === floor.id ? 0 : -1"
      @click="emit('update:modelValue', floor.id)"
      @keydown="handleKeydown($event, floors.indexOf(floor))"
    >
      {{ floor.name }}
    </button>
  </div>
</template>
