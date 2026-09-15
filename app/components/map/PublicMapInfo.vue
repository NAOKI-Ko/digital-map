<script setup lang="ts">
defineProps<{
  mapName: string
  organizationName: string | null
  logoUrl: string | null
  websiteUrl: string | null
  snsUrl: string | null
  officialLabel: string
}>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-end bg-stone-950/25 sm:items-center sm:justify-center sm:p-5" @click.self="emit('close')">
    <section role="dialog" aria-modal="true" aria-labelledby="public-map-info-title" class="max-h-[85svh] w-full overflow-y-auto rounded-t-3xl bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-6" @keydown.esc="emit('close')">
      <div class="flex items-start justify-between gap-4">
        <div class="flex min-w-0 items-center gap-3">
          <img v-if="logoUrl" :src="logoUrl" :alt="`${organizationName ?? mapName}のロゴ`" class="size-12 shrink-0 rounded-xl object-contain">
          <div class="min-w-0"><p class="text-xs font-semibold tracking-widest text-terracotta-700">{{ organizationName ?? 'DIGITAL MAP' }}</p><h2 id="public-map-info-title" class="mt-1 text-xl font-bold">{{ mapName }}</h2></div>
        </div>
        <button type="button" class="grid size-11 shrink-0 place-items-center rounded-full bg-stone-100 text-xl" aria-label="Infoを閉じる" @click="emit('close')">×</button>
      </div>
      <nav aria-label="マップ情報" class="mt-6 grid gap-2">
        <a v-if="websiteUrl" :href="websiteUrl" target="_blank" rel="noopener noreferrer" class="flex min-h-12 items-center rounded-xl bg-stone-100 px-4 font-semibold">{{ officialLabel }}</a>
        <a v-if="snsUrl" :href="snsUrl" target="_blank" rel="noopener noreferrer" class="flex min-h-12 items-center rounded-xl bg-stone-100 px-4 font-semibold">SNS</a>
        <NuxtLink to="/terms" class="flex min-h-12 items-center rounded-xl px-4 font-semibold hover:bg-stone-100">利用規約</NuxtLink>
        <NuxtLink to="/privacy" class="flex min-h-12 items-center rounded-xl px-4 font-semibold hover:bg-stone-100">プライバシーポリシー</NuxtLink>
      </nav>
    </section>
  </div>
</template>
