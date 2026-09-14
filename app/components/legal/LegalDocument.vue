<script setup lang="ts">
import type { LegalDocument } from '~~/content/legal/config'
defineProps<{ document: LegalDocument }>()
const contact = useRuntimeConfig().public.legalContact as string
</script>

<template>
  <main class="min-h-screen bg-stone-50 px-5 py-12 text-stone-900"><article class="mx-auto max-w-3xl rounded-2xl border border-stone-200 bg-white p-7 shadow-sm sm:p-12"><NuxtLink to="/" class="text-sm font-semibold text-terracotta-700">Digital Map Platform</NuxtLink><h1 class="mt-6 text-3xl font-bold">{{ document.title }}</h1><p class="mt-3 text-sm text-stone-500">版: {{ document.version }} / 適用日: {{ document.effectiveDate }}</p><p class="mt-6 leading-7 text-stone-700">{{ document.introduction }}</p><section v-for="section in document.sections" :key="section.heading" class="mt-9"><h2 class="text-xl font-bold">{{ section.heading }}</h2><p v-for="paragraph in section.paragraphs" :key="paragraph" class="mt-3 leading-7 text-stone-700">{{ paragraph }}</p><ul v-if="section.items" class="mt-3 list-disc space-y-2 pl-6"><li v-for="item in section.items" :key="item">{{ item }}</li></ul></section><footer class="mt-10 border-t pt-6 text-sm text-stone-600"><p>お問い合わせ: <a :href="`mailto:${contact}`" class="font-semibold underline">{{ contact }}</a></p><nav class="mt-4 flex gap-4"><NuxtLink to="/terms" class="underline">利用規約</NuxtLink><NuxtLink to="/privacy" class="underline">プライバシーポリシー</NuxtLink></nav></footer></article></main>
</template>
