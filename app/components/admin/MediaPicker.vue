<script setup lang="ts">
import ImageUploader from './ImageUploader.vue'
import type { MediaAssetItem, MediaAssetListResponse } from '~~/shared/types/media'
import type { UploadedImage } from '~~/shared/types/upload'

type Scope = 'recent' | 'map' | 'all'
type UsageFilter = 'all' | 'floor' | 'photo' | 'category' | 'pin' | 'logo'

const props = withDefaults(defineProps<{
  mapId: string
  label?: string
  usage?: Exclude<UsageFilter, 'all'>
}>(), { label: '画像', usage: 'photo' })
const emit = defineEmits<{ selected: [image: UploadedImage] }>()
const { data, refresh } = await useFetch<MediaAssetListResponse>('/api/media')
const scope = ref<Scope>('recent')
const usageFilter = ref<UsageFilter>('all')
const scopeOptions: Array<{ id: Scope, label: string }> = [
  { id: 'recent', label: '最近使用' },
  { id: 'map', label: 'このMAPで使用' },
  { id: 'all', label: 'すべて' },
]

const visibleAssets = computed(() => {
  let assets = data.value?.assets ?? []
  if (scope.value === 'recent') assets = assets.slice(0, 12)
  if (scope.value === 'map') assets = assets.filter(asset => asset.usedInMapIds.includes(props.mapId))
  if (usageFilter.value !== 'all') {
    const field = {
      floor: 'floorIllustrations',
      photo: 'spotPhotos',
      category: 'categoryIcons',
      pin: 'spotPins',
      logo: 'mapLogos',
    }[usageFilter.value] as keyof MediaAssetItem['usage']
    assets = assets.filter(asset => asset.usage[field] > 0)
  }
  return assets
})

function selectAsset(asset: MediaAssetItem) {
  emit('selected', {
    assetId: asset.id,
    url: asset.url,
    filename: asset.originalFilename,
    mimeType: asset.mimeType as UploadedImage['mimeType'],
    size: asset.fileSize,
    width: asset.width,
    height: asset.height,
  })
}

async function useUpload(image: UploadedImage) {
  emit('selected', image)
  await refresh()
}
</script>

<template>
  <div class="rounded-xl border border-stone-200 p-4">
    <div class="grid gap-5 lg:grid-cols-2">
      <section>
        <h3 class="text-sm font-bold text-stone-900">新規アップロード</h3>
        <ImageUploader :label="label" @uploaded="useUpload" />
      </section>
      <section>
        <h3 class="text-sm font-bold text-stone-900">登録済み画像から選ぶ</h3>
        <div class="mt-2 flex flex-wrap gap-2">
          <button v-for="item in scopeOptions" :key="item.id" type="button" class="rounded-full px-3 py-1.5 text-xs font-semibold" :class="scope === item.id ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700'" @click="scope = item.id">{{ item.label }}</button>
        </div>
        <label class="mt-3 block text-xs font-semibold text-stone-700">用途フィルター
          <select v-model="usageFilter" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">
            <option value="all">すべての用途</option><option value="floor">フロアイラスト</option><option value="photo">Spot写真</option><option value="category">Category</option><option value="pin">Custom PIN</option><option value="logo">ロゴ</option>
          </select>
        </label>
        <p class="mt-2 text-xs text-stone-500">用途は絞り込みだけに使われ、別用途の画像も選択できます。</p>
        <div v-if="visibleAssets.length" class="mt-3 grid max-h-72 grid-cols-3 gap-2 overflow-auto">
          <button v-for="asset in visibleAssets" :key="asset.id" type="button" class="overflow-hidden rounded-lg border border-stone-200 bg-white p-1 hover:border-terracotta-500" :title="asset.originalFilename" @click="selectAsset(asset)">
            <img :src="asset.url" :alt="asset.originalFilename" class="aspect-square w-full object-contain">
          </button>
        </div>
        <p v-else class="mt-4 rounded-lg bg-stone-50 p-4 text-center text-xs text-stone-500">該当する登録画像はありません。</p>
      </section>
    </div>
  </div>
</template>
