<script setup lang="ts">
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle } from 'reka-ui'
import FacilitySymbol from '~/components/map/FacilitySymbol.vue'
import { summarizeVisitorFacilities } from '~/utils/visitor-facility-summary'
import type { PublicFloor } from '~~/shared/types/public-map'

const props = defineProps<{ floors: readonly PublicFloor[], modelValue: string }>()
const floorSummaries = computed(() => props.floors.map(floor => ({ ...floor, ...summarizeVisitorFacilities(floor.spots) })))
const emit = defineEmits<{ close: [], select: [floorId: string] }>()
</script>

<template>
  <DialogRoot :open="true" @update:open="open => { if (!open) emit('close') }">
    <DialogPortal>
    <DialogOverlay v-if="floors.length > 1" class="fixed inset-0 z-50 flex items-end bg-stone-950/25 sm:items-center sm:justify-center sm:p-5" @click.self="emit('close')">
    <DialogContent :aria-describedby="undefined" @close-auto-focus="event => event.preventDefault()" class="visitor-theme visitor-dialog max-h-[85dvh] overflow-y-auto w-full rounded-t-3xl bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 shadow-2xl sm:max-w-sm sm:rounded-3xl sm:p-6" >
      <div class="flex items-center justify-between gap-4">
        <DialogTitle class="text-lg font-bold">フロアを選択</DialogTitle>
        <button type="button" class="visitor-close grid size-11 place-items-center rounded-full bg-stone-100 text-xl" aria-label="フロア選択を閉じる" @click="emit('close')">×</button>
      </div>
      <p class="visitor-muted mt-2 text-sm">見たいフロアを選ぶと、そのフロアのマップに切り替わります。</p>
      <div class="mt-4 grid gap-2" role="group" aria-label="フロア">
        <button v-for="floor in floorSummaries" :key="floor.id" type="button" :aria-pressed="floor.id === modelValue" class="visitor-floor-choice flex min-h-16 items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold" @click="emit('select', floor.id)">
          <span class="w-5 shrink-0" aria-hidden="true">{{ floor.id === modelValue ? '✓' : '' }}</span>
          <span class="min-w-0 flex-1">
            <span class="flex items-baseline justify-between gap-3"><span class="break-words">{{ floor.name }}</span><span v-if="floor.id === modelValue" class="shrink-0 text-xs">表示中</span></span>
            <span class="visitor-muted mt-1 block text-xs font-normal leading-5">{{ floor.spots.length ? `${floor.destinationCount}目的地${floor.facilityCount ? ` · ${floor.facilityCount}設備` : ''}` : 'スポットはまだありません' }}</span>
            <span v-if="floor.facilities.length" class="visitor-floor-facilities visitor-muted mt-2 text-xs font-normal leading-5">
              <span v-for="facility in floor.facilities" :key="facility.id" class="visitor-floor-facility">
                <FacilitySymbol :appearance="{ pinIconType: 'preset', pinIconId: facility.id }" size="sm" />
                <span :aria-hidden="facility.shortLabel !== facility.label ? true : undefined">{{ facility.shortLabel }}</span>
                <span v-if="facility.shortLabel !== facility.label" class="sr-only">{{ facility.label }}</span>
              </span>
            </span>
          </span>
        </button>
      </div>
    </DialogContent>
    </DialogOverlay>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
.visitor-floor-choice { color: var(--visitor-ink); background: var(--visitor-surface); box-shadow: inset 0 0 0 1px var(--visitor-border); }
.visitor-floor-choice[aria-pressed="true"] { color: var(--visitor-active); background: var(--visitor-active-soft); box-shadow: inset 0 0 0 1px var(--visitor-active); }
.visitor-floor-facilities { display: flex; flex-wrap: wrap; gap: .375rem .75rem; }
.visitor-floor-facility { display: inline-flex; align-items: center; gap: .375rem; }
@media (hover: hover) { .visitor-floor-choice[aria-pressed="false"]:hover { background: var(--visitor-active-soft); } }
button:focus-visible { outline: 2px solid var(--visitor-focus); outline-offset: 2px; }
</style>
