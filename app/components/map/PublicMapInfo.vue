<script setup lang="ts">
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle } from 'reka-ui'
const props = defineProps<{
  mapName: string
  organizationName: string | null
  logoUrl: string | null
  websiteUrl: string | null
  snsUrl: string | null
  officialLabel: string
}>()
const emit = defineEmits<{ close: [] }>()
const logoFailed = ref(false)
watch(() => props.logoUrl, () => { logoFailed.value = false })
</script>

<template>
  <DialogRoot :open="true" @update:open="open => { if (!open) emit('close') }">
    <DialogPortal>
    <DialogOverlay class="fixed inset-0 z-50 flex items-end bg-stone-950/25 sm:items-center sm:justify-center sm:p-5" @click.self="emit('close')">
    <DialogContent :aria-describedby="undefined" @close-auto-focus="event => event.preventDefault()" class="max-h-[85svh] w-full overflow-y-auto rounded-t-3xl bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-6" >
      <div class="flex items-start justify-between gap-4">
        <div class="flex min-w-0 items-center gap-3">
          <img v-if="logoUrl && !logoFailed" :src="logoUrl" :alt="`${organizationName ?? mapName}のロゴ`" class="size-12 shrink-0 rounded-xl object-contain" @error="logoFailed = true">
          <div class="min-w-0"><p class="break-words text-xs font-semibold tracking-widest text-terracotta-700">{{ organizationName ?? 'DIGITAL MAP' }}</p><DialogTitle class="mt-1 break-words text-xl font-bold">{{ mapName }}</DialogTitle></div>
        </div>
        <button type="button" class="grid size-11 shrink-0 place-items-center rounded-full bg-stone-100 text-xl" aria-label="マップ情報を閉じる" @click="emit('close')">×</button>
      </div>
      <nav aria-label="マップ情報" class="mt-6 grid gap-2">
        <a v-if="websiteUrl" :href="websiteUrl" target="_blank" rel="noopener noreferrer" class="flex min-h-12 items-center rounded-xl bg-stone-100 px-4 font-semibold">{{ officialLabel }}</a>
        <a v-if="snsUrl" :href="snsUrl" target="_blank" rel="noopener noreferrer" class="flex min-h-12 items-center rounded-xl bg-stone-100 px-4 font-semibold">SNS</a>
        <NuxtLink to="/terms" class="flex min-h-12 items-center rounded-xl px-4 font-semibold hover:bg-stone-100">利用規約</NuxtLink>
        <NuxtLink to="/privacy" class="flex min-h-12 items-center rounded-xl px-4 font-semibold hover:bg-stone-100">プライバシーポリシー</NuxtLink>
      </nav>
    </DialogContent>
    </DialogOverlay>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
button:focus-visible, a:focus-visible { outline: 2px solid #9a3412; outline-offset: 2px; }
</style>
