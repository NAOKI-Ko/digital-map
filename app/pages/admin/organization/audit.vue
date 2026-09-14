<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
const events = ref<any[]>([]); const cursor = ref<string | null>(null); const loading = ref(false)
async function load() { loading.value = true; try { const page = await $fetch('/api/organization/audit', { query: cursor.value ? { cursor: cursor.value } : {} }); events.value.push(...page.events); cursor.value = page.nextCursor } finally { loading.value = false } }
await load()
</script>
<template><section class="max-w-5xl"><NuxtLink to="/admin/organization" class="text-sm underline">← 組織設定へ</NuxtLink><h1 class="mt-5 text-2xl font-bold">監査ログ</h1><div class="mt-6 divide-y rounded-xl bg-white px-5"><article v-for="event in events" :key="event.id" class="py-4"><div class="flex flex-wrap justify-between gap-2"><strong>{{ event.action }}</strong><time class="text-sm text-stone-500">{{ new Date(event.createdAt).toLocaleString('ja-JP') }}</time></div><p class="mt-1 text-sm">{{ event.actorUser?.displayName || event.actorUser?.email || 'SYSTEM' }} · {{ event.targetType }} / {{ event.targetId }}</p><pre v-if="Object.keys(event.metadata ?? {}).length" class="mt-2 overflow-auto text-xs text-stone-500">{{ JSON.stringify(event.metadata) }}</pre></article></div><button v-if="cursor" :disabled="loading" class="mt-4 rounded border px-4 py-2" @click="load">続きを読み込む</button></section></template>
