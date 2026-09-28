<script setup lang="ts">
import AppDialog from '~/components/ui/AppDialog.vue'
import SpotPhotoManager from './SpotPhotoManager.vue'
import type { AdminSpotResponse } from '~~/shared/types/spot'
const props = defineProps<{ mapId: string, spotId: string }>()
const emit = defineEmits<{ close: [], updated: [] }>()
const busy = ref(false)
const { data, error, refresh } = await useFetch<AdminSpotResponse>(`/api/maps/${props.mapId}/spots/${props.spotId}`)
async function updated() { await refresh(); emit('updated') }
</script>
<template>
  <AppDialog open :title="`${data?.spot.name ?? 'スポット'}の写真`" description="このスポットの写真を選びます。写真は任意です。" max-width="lg" @close="!busy && emit('close')">
    <p v-if="error" role="alert">読み込めませんでした。<button type="button" class="underline" @click="refresh()">再読み込み</button></p>
    <SpotPhotoManager v-if="data" :map-id="mapId" :spot-id="spotId" :expected-version="data.spot.liveVersion" :initial-photos="data.spot.photos" :initial-photo-asset-ids="data.spot.photoAssetIds" @busy="busy = $event" @updated="updated" />
    <button type="button" :disabled="busy" class="mt-4 rounded border px-4 py-2" @click="emit('close')">一覧に戻る</button>
  </AppDialog>
</template>
