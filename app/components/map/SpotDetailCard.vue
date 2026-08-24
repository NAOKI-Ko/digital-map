<script setup lang="ts">
import type { PublicSpot } from '~~/shared/types/public-map'

const props = defineProps<{
  spot: PublicSpot
}>()

defineEmits<{
  close: []
}>()

const expanded = ref(false)

watch(() => props.spot.id, () => {
  expanded.value = false
})
</script>

<template>
  <div class="pointer-events-none fixed inset-0 z-40 flex items-end p-0 sm:pointer-events-auto sm:items-center sm:justify-end sm:bg-stone-950/30 sm:p-5" @click.self="$emit('close')">
    <article
      role="dialog"
      :aria-labelledby="`spot-detail-title-${spot.id}`"
      class="pointer-events-auto w-full rounded-t-3xl bg-white shadow-2xl transition-[max-height] sm:max-h-[calc(100svh-2.5rem)] sm:max-w-md sm:overflow-y-auto sm:rounded-3xl"
      :class="expanded ? 'max-h-[82svh] overflow-y-auto' : 'max-h-36 overflow-hidden'"
    >
      <button
        type="button"
        class="flex h-8 w-full items-center justify-center sm:hidden"
        :aria-expanded="expanded"
        :aria-label="expanded ? 'スポット詳細を折りたたむ' : 'スポット詳細を展開する'"
        @click="expanded = !expanded"
      >
        <span class="h-1.5 w-12 rounded-full bg-stone-300" />
      </button>

      <div v-if="spot.photos.length" class="snap-x snap-mandatory overflow-x-auto bg-stone-100" :class="expanded ? 'flex' : 'hidden sm:flex'">
        <img
          v-for="(photo, index) in spot.photos"
          :key="photo"
          :src="photo"
          :alt="`${spot.name}の写真${index + 1}`"
          class="h-52 w-full shrink-0 snap-center object-cover sm:h-64"
        >
      </div>

      <div class="relative px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-1 sm:p-6">
        <button
          type="button"
          class="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-stone-100 text-xl leading-none text-stone-700 hover:bg-stone-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
          aria-label="スポット詳細を閉じる"
          @click="$emit('close')"
        >
          ×
        </button>

        <div v-if="spot.categories.length" class="flex flex-wrap gap-1.5 pr-12">
          <span v-for="category in spot.categories" :key="category.id" class="rounded-full bg-terracotta-50 px-2 py-1 text-xs font-semibold text-terracotta-700">{{ category.name }}</span>
        </div>
        <h2 :id="`spot-detail-title-${spot.id}`" class="mt-1 pr-12 text-2xl font-bold tracking-tight text-stone-900">
          {{ spot.name }}
        </h2>
        <div :class="expanded ? 'block' : 'hidden sm:block'">
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
      </div>
    </article>
  </div>
</template>
