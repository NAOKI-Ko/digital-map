<script setup lang="ts">
const props = defineProps<{ mapId: string, spotId: string, floors: Array<{ id: string, name: string }> }>()
const emit = defineEmits<{ updated: [] }>()
const endpoint = `/api/maps/${props.mapId}/spots/${props.spotId}/placements`
type Placement = { id: string, floorId: string, x: number | null, y: number | null, version: number, isPrimary: boolean, floor: { name: string } }
const { data, refresh } = await useFetch<{ placements: Placement[] }>(endpoint)
const floorId = ref(props.floors[0]?.id ?? '')
const busy = ref(false)
const error = ref('')
async function add() {
  busy.value = true; error.value = ''
  try {
    const { placement } = await $fetch<{ placement: Placement }>(endpoint, { method: 'POST', body: { floorId: floorId.value, x: null, y: null } })
    await navigateTo({ path: `/admin/maps/${props.mapId}/editor`, query: { floorId: floorId.value, placeSpotId: placement.id } })
  }
  catch (e: any) { error.value = e?.data?.statusMessage ?? '配置を追加できませんでした。' }
  finally { busy.value = false }
}
async function remove(id: string, expectedVersion: number) {
  busy.value = true; error.value = ''
  try { await $fetch(`${endpoint}/${id}`, { method: 'DELETE', body: { expectedVersion } }); await refresh(); emit('updated') }
  catch (e: any) { error.value = e?.data?.statusMessage ?? '配置を削除できませんでした。再読込してください。' }
  finally { busy.value = false }
}
</script>
<template>
  <section class="mt-6 rounded-xl border border-stone-200 p-5">
    <h2 class="font-semibold">このスポットの配置</h2>
    <p class="mt-2 text-sm text-stone-600">同じマップの複数のフロアに配置できます。名前・本文・写真は共通です。配置を削除してもスポットの内容は残ります。</p>
    <ul class="mt-3 divide-y">
      <li v-for="item in data?.placements" :key="item.id" class="flex items-center justify-between gap-3 py-2 text-sm">
        <NuxtLink :to="{ path: `/admin/maps/${mapId}/editor`, query: { floorId: item.floorId, placeSpotId: item.id } }" class="min-h-11 py-3 font-semibold text-terracotta-700">{{ item.floor.name }} · {{ item.x === null ? '未配置' : '配置済み' }}{{ item.isPrimary ? '（基本の配置）' : '' }}</NuxtLink>
        <button type="button" :disabled="busy" class="min-h-11 shrink-0 px-3 text-red-700" @click="remove(item.id, item.version)">配置を削除</button>
      </li>
    </ul>
    <form class="mt-3 flex flex-wrap gap-2" @submit.prevent="add">
      <label class="text-sm">追加先のフロア<select v-model="floorId" class="ml-2 min-h-11 rounded border px-3"><option v-for="floor in floors" :key="floor.id" :value="floor.id">{{ floor.name }}</option></select></label>
      <button :disabled="busy || !floorId" class="min-h-11 rounded border px-4 text-sm font-semibold disabled:opacity-50">配置を追加</button>
    </form>
    <p v-if="error" role="alert" class="mt-2 text-sm text-red-700">{{ error }}</p>
  </section>
</template>
