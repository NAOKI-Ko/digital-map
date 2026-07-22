<script setup lang="ts">
import type { PublicSpot } from '~~/shared/types/public-map'

defineProps<{
  spot: PublicSpot
}>()

defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="fixed inset-0 z-40 flex items-end bg-stone-950/30 p-0 sm:items-center sm:justify-end sm:p-5" @click.self="$emit('close')">
    <article
      role="dialog"
      aria-modal="true"
      :aria-labelledby="`spot-detail-title-${spot.id}`"
      class="max-h-[82svh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-h-[calc(100svh-2.5rem)] sm:max-w-md sm:rounded-3xl"
    >
      <div v-if="spot.photos.length" class="flex snap-x snap-mandatory overflow-x-auto bg-stone-100">
        <img
          v-for="(photo, index) in spot.photos"
          :key="photo"
          :src="photo"
          :alt="`${spot.name}の写真${index + 1}`"
          class="h-52 w-full shrink-0 snap-center object-cover sm:h-64"
        >
      </div>

      <div class="relative px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:p-6">
        <button
          type="button"
          class="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-stone-100 text-xl leading-none text-stone-700 hover:bg-stone-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
          aria-label="スポット詳細を閉じる"
          @click="$emit('close')"
        >
          ×
        </button>

        <p class="pr-12 text-xs font-semibold text-terracotta-700">{{ spot.category }}</p>
        <h2 :id="`spot-detail-title-${spot.id}`" class="mt-1 pr-12 text-2xl font-bold tracking-tight text-stone-900">
          {{ spot.name }}
        </h2>
        <p v-if="spot.description" class="mt-4 whitespace-pre-line text-sm leading-7 text-stone-700">
          {{ spot.description }}
        </p>

        <dl v-if="spot.hoursText || spot.holidayText || spot.phone" class="mt-6 divide-y divide-stone-200 border-y border-stone-200 text-sm">
          <div v-if="spot.hoursText" class="grid grid-cols-[5.5rem_1fr] gap-3 py-3">
            <dt class="font-semibold text-stone-500">営業時間</dt>
            <dd class="whitespace-pre-line text-stone-800">{{ spot.hoursText }}</dd>
          </div>
          <div v-if="spot.holidayText" class="grid grid-cols-[5.5rem_1fr] gap-3 py-3">
            <dt class="font-semibold text-stone-500">定休日</dt>
            <dd class="whitespace-pre-line text-stone-800">{{ spot.holidayText }}</dd>
          </div>
          <div v-if="spot.phone" class="grid grid-cols-[5.5rem_1fr] gap-3 py-3">
            <dt class="font-semibold text-stone-500">電話番号</dt>
            <dd><a :href="`tel:${spot.phone}`" class="font-semibold text-terracotta-700 underline decoration-terracotta-300 underline-offset-4">{{ spot.phone }}</a></dd>
          </div>
        </dl>
      </div>
    </article>
  </div>
</template>
