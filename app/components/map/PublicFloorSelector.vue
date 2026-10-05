<script setup lang="ts">
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle } from 'reka-ui'
import { getPinIconPreset, isFacilityPinIcon } from '~~/shared/constants/spot'
import type { PublicFloor } from '~~/shared/types/public-map'

const props = defineProps<{ floors: readonly PublicFloor[], modelValue: string }>()
const floorSummaries = computed(() => props.floors.map(floor => {
  const facilities = floor.spots.filter(isFacilityPinIcon)
  return {
    ...floor,
    destinationCount: floor.spots.length - facilities.length,
    facilityCount: facilities.length,
    facilityNames: [...new Set(facilities.map(spot => getPinIconPreset(spot.pinIconId).label))].join('・'),
  }
}))
const emit = defineEmits<{ close: [], select: [floorId: string] }>()
</script>

<template>
  <DialogRoot :open="true" @update:open="open => { if (!open) emit('close') }">
    <DialogPortal>
    <DialogOverlay v-if="floors.length > 1" class="fixed inset-0 z-50 flex items-end bg-stone-950/25 sm:items-center sm:justify-center sm:p-5" @click.self="emit('close')">
    <DialogContent :aria-describedby="undefined" @close-auto-focus="event => event.preventDefault()" class="max-h-[85dvh] overflow-y-auto w-full rounded-t-3xl bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 shadow-2xl sm:max-w-sm sm:rounded-3xl sm:p-6" >
      <div class="flex items-center justify-between gap-4">
        <DialogTitle class="text-lg font-bold">フロアを選択</DialogTitle>
        <button type="button" class="grid size-11 place-items-center rounded-full bg-stone-100 text-xl" aria-label="フロア選択を閉じる" @click="emit('close')">×</button>
      </div>
      <p class="mt-2 text-sm text-stone-600">見たいフロアを選ぶと、そのフロアのマップに切り替わります。</p>
      <div class="mt-4 grid gap-2" role="group" aria-label="フロア">
        <button v-for="floor in floorSummaries" :key="floor.id" type="button" :aria-pressed="floor.id === modelValue" class="flex min-h-16 items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold hover:bg-stone-100" :class="floor.id === modelValue ? 'bg-terracotta-50 text-terracotta-800' : 'text-stone-700'" @click="emit('select', floor.id)">
          <span class="w-5 shrink-0" aria-hidden="true">{{ floor.id === modelValue ? '✓' : '' }}</span>
          <span class="min-w-0 flex-1">
            <span class="flex items-baseline justify-between gap-3"><span class="break-words">{{ floor.name }}</span><span v-if="floor.id === modelValue" class="shrink-0 text-xs">表示中</span></span>
            <span class="mt-1 block text-xs font-normal leading-5 text-stone-600">{{ floor.spots.length ? `${floor.destinationCount}目的地${floor.facilityCount ? ` · ${floor.facilityCount}設備` : ''}` : 'スポットはまだありません' }}</span>
            <span v-if="floor.facilityNames" class="mt-0.5 block break-words text-xs font-normal leading-5 text-stone-600">{{ floor.facilityNames }}</span>
          </span>
        </button>
      </div>
    </DialogContent>
    </DialogOverlay>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
button:focus-visible { outline: 2px solid #9a3412; outline-offset: 2px; }
</style>
