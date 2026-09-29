<script setup lang="ts">
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle } from 'reka-ui'
import type { PublicFloor } from '~~/shared/types/public-map'

defineProps<{ floors: readonly PublicFloor[], modelValue: string }>()
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
      <div class="mt-4 grid gap-1" role="group" aria-label="フロア">
        <button v-for="floor in floors" :key="floor.id" type="button" :aria-pressed="floor.id === modelValue" class="flex min-h-12 items-center gap-3 rounded-xl px-4 text-left font-semibold hover:bg-stone-100" :class="floor.id === modelValue ? 'bg-terracotta-50 text-terracotta-800' : 'text-stone-700'" @click="emit('select', floor.id)">
          <span class="w-5" aria-hidden="true">{{ floor.id === modelValue ? '✓' : '' }}</span><span>{{ floor.name }}</span>
        </button>
      </div>
    </DialogContent>
    </DialogOverlay>
    </DialogPortal>
  </DialogRoot>
</template>
