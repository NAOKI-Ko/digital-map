<script setup lang="ts">
import type { PaperMapConfig } from '~~/shared/schemas/paper-map'
import type { PaperMapSource } from '~~/shared/types/paper-map'
import { containRect, resolvePaperLayout, resolveViewport, viewportPoint } from '~~/shared/utils/paper-map-layout'

const props = defineProps<{ config: PaperMapConfig, source: PaperMapSource }>()
const page = computed(() => props.config.orientation === 'landscape' ? { width: 1120, height: 792 } : { width: 792, height: 1120 })
const layout = computed(() => resolvePaperLayout(props.config, page.value.width, page.value.height))
const allSpots = computed(() => {
  let spots = props.source.map.floors.flatMap(floor => floor.spots)
  if (props.config.selectionMode === 'categories') spots = spots.filter(spot => spot.categories.some(category => props.config.categoryIds.includes(category.id)))
  if (props.config.selectionMode === 'spots') spots = spots.filter(spot => props.config.spotIds.includes(spot.id))
  return spots
})
const floor = computed(() => props.source.map.floors.find(item => item.spots.some(spot => allSpots.value.some(selected => selected.id === spot.id))) ?? props.source.map.floors[0])
const spots = computed(() => floor.value?.spots.filter(spot => allSpots.value.some(selected => selected.id === spot.id)) ?? [])
const viewport = computed(() => resolveViewport(props.config, spots.value))
const imageRect = computed(() => floor.value ? containRect(floor.value.imageWidth * viewport.value.width, floor.value.imageHeight * viewport.value.height, layout.value.mapFrame) : layout.value.mapFrame)
const markers = computed(() => spots.value.map((spot) => ({ ...spot, point: viewportPoint(spot, viewport.value, imageRect.value), number: allSpots.value.findIndex(item => item.id === spot.id) + 1 })))
const palette = computed(() => ({ brand: ['#b4532a', '#fffaf5'], simple: ['#334155', '#fff'], warm: ['#c2410c', '#fffbeb'], natural: ['#3f6212', '#f7fee7'] }[props.config.theme]!))
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-stone-200 bg-stone-100 p-3" aria-label="紙マップのライブプレビュー">
    <svg :viewBox="`0 0 ${page.width} ${page.height}`" class="mx-auto block max-h-[72vh] w-full drop-shadow-lg" role="img" :aria-label="`${config.title}の印刷プレビュー`">
      <rect width="100%" height="100%" :fill="palette[1]" />
      <text :x="layout.margin" :y="layout.margin + 30" font-size="30" font-weight="700" fill="#292524">{{ config.title }}</text>
      <text :x="layout.margin" :y="layout.margin + 60" font-size="18" fill="#57534e">{{ config.subtitle || floor?.name }}</text>
      <defs><clipPath id="paper-preview-map"><rect :x="layout.mapFrame.x" :y="layout.mapFrame.y" :width="layout.mapFrame.width" :height="layout.mapFrame.height" /></clipPath></defs>
      <rect :x="layout.mapFrame.x" :y="layout.mapFrame.y" :width="layout.mapFrame.width" :height="layout.mapFrame.height" fill="#e7e5e4" :stroke="palette[0]" stroke-width="3" />
      <image v-if="floor" :href="floor.illustrationUrl" :x="imageRect.x" :y="imageRect.y" :width="imageRect.width" :height="imageRect.height" preserveAspectRatio="none" clip-path="url(#paper-preview-map)" />
      <g v-for="marker in markers" :key="marker.id">
        <circle :cx="marker.point.x" :cy="marker.point.y" r="15" :fill="marker.pinColor || palette[0]" stroke="white" stroke-width="3" />
        <text :x="marker.point.x" :y="marker.point.y + 5" text-anchor="middle" font-size="14" font-weight="700" fill="white">{{ marker.number }}</text>
      </g>
      <text :x="layout.infoFrame.x" :y="layout.infoFrame.y + 20" font-size="20" font-weight="700" :fill="palette[0]">スポット案内</text>
      <text v-for="(spot, index) in allSpots.slice(0, 14)" :key="spot.id" :x="layout.infoFrame.x" :y="layout.infoFrame.y + 48 + index * 25" font-size="15" fill="#292524">{{ index + 1 }}. {{ spot.name }}</text>
      <g v-if="config.qrEnabled" :transform="`translate(${page.width - layout.margin - 64} ${page.height - layout.margin - 64})`"><rect width="64" height="64" fill="white" stroke="#78716c"/><path d="M8 8h18v18H8zM38 8h18v18H38zM8 38h18v18H8zM36 36h8v8h-8zM48 36h8v20h-8zM36 48h8v8h-8z" fill="#292524" /></g>
    </svg>
  </div>
</template>
