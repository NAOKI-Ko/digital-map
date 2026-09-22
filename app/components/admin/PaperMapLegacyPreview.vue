<script setup lang="ts">
import type { PaperMapConfig, PaperSlotId } from '~~/shared/schemas/paper-map'
import type { PaperMapSource } from '~~/shared/types/paper-map'
import { resolvePaperRenderModel } from '~~/shared/utils/paper-map-render'

const props = defineProps<{ config: PaperMapConfig, source: PaperMapSource, selectedSlot?: PaperSlotId | 'title' | null }>()
const emit = defineEmits<{ slotSelect: [slot: PaperSlotId | 'title'] }>()
const model = computed(() => resolvePaperRenderModel(props.source, props.config, 96))
const palette = computed(() => ({ brand: ['#9a4829', '#fffdf9'], simple: ['#334155', '#fff'], warm: ['#c2410c', '#fffbeb'], natural: ['#3f6212', '#fbfdf7'] }[props.config.presentation.theme] as [string, string]))
const selectedClass = (slot: PaperSlotId | 'title') => props.selectedSlot === slot ? 'outline outline-[5px] outline-sky-400/70' : ''
const overlayStyle = (rect: { x: number, y: number, width: number, height: number }) => ({ left: `${rect.x / model.value.size.widthPx * 100}%`, top: `${rect.y / model.value.size.heightPx * 100}%`, width: `${rect.width / model.value.size.widthPx * 100}%`, height: `${rect.height / model.value.size.heightPx * 100}%` })
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-stone-200 bg-stone-100 p-3" aria-label="紙マップのライブプレビュー">
    <div class="relative">
    <svg :viewBox="`0 0 ${model.size.widthPx} ${model.size.heightPx}`" class="mx-auto block max-h-[74vh] w-full drop-shadow-xl" role="img" :aria-label="`${model.title}の印刷プレビュー`">
      <rect width="100%" height="100%" :fill="palette[1]" />
      <g role="button" tabindex="0" :class="selectedClass('title')" @click="emit('slotSelect', 'title')" @keydown.enter="emit('slotSelect', 'title')"><text :x="model.mapFrame.x" :y="model.size.heightPx * .068" :font-size="model.size.widthPx * .021" font-weight="700" fill="#292524">{{ model.title }}</text><text :x="model.mapFrame.x" :y="model.size.heightPx * .098" :font-size="model.size.widthPx * .011" fill="#78716c">{{ model.subtitle }}</text></g>
      <text v-if="model.visible('intro') && model.intro" :x="model.mapFrame.x" :y="model.mapFrame.y - 12" :font-size="model.size.widthPx * .009" fill="#78716c" role="button" tabindex="0" @click="emit('slotSelect', 'intro')">{{ model.intro.slice(0, 80) }}</text>
      <defs><clipPath id="paper-template-map"><rect :x="model.mapFrame.x" :y="model.mapFrame.y" :width="model.mapFrame.width" :height="model.mapFrame.height" /></clipPath></defs>
      <rect :x="model.mapFrame.x" :y="model.mapFrame.y" :width="model.mapFrame.width" :height="model.mapFrame.height" fill="#e7e5e4" :stroke="palette[0]" stroke-width="3" />
      <image v-if="model.floor" :href="model.floor.illustrationUrl" :x="model.imageRect.x" :y="model.imageRect.y" :width="model.imageRect.width" :height="model.imageRect.height" preserveAspectRatio="none" clip-path="url(#paper-template-map)" />
      <g v-for="spot in model.spots.filter(item => item.point)" :key="spot.id"><circle :cx="spot.point!.x" :cy="spot.point!.y" r="15" :fill="spot.pinColor || palette[0]" stroke="white" stroke-width="3"/><text :x="spot.point!.x" :y="spot.point!.y + 5" text-anchor="middle" font-size="14" font-weight="700" fill="white">{{ spot.number }}</text></g>
      <g v-if="model.visible('spotGuide')" role="button" tabindex="0" :class="selectedClass('spotGuide')" @click="emit('slotSelect', 'spotGuide')" @keydown.enter="emit('slotSelect', 'spotGuide')"><text :x="model.infoFrame.x" :y="model.infoFrame.y + 20" font-size="20" font-weight="700" :fill="palette[0]">スポット案内</text><g v-for="(spot, index) in model.spots.slice(0, config.templateId === 'photo-story' ? 7 : 12)" :key="spot.id"><text :x="model.infoFrame.x" :y="model.infoFrame.y + 49 + index * 36" font-size="15" font-weight="700" fill="#292524">{{ spot.number }}. {{ spot.name }}</text><text v-if="config.presentation.informationDensity === 'detail'" :x="model.infoFrame.x + 22" :y="model.infoFrame.y + 67 + index * 36" font-size="10" fill="#78716c">{{ spot.summary.slice(0, 35) }}</text></g></g>
      <g v-if="model.visible('photoFeature') && model.photos.length" role="button" tabindex="0" @click="emit('slotSelect', 'photoFeature')"><image v-for="(spot, index) in model.photos.slice(0, 4)" :key="spot.id" :href="spot.photos[0]" :x="model.infoFrame.x + (index % 2) * (model.infoFrame.width / 2)" :y="model.infoFrame.y + model.infoFrame.height - 145 + Math.floor(index / 2) * 70" :width="model.infoFrame.width / 2 - 6" height="64" preserveAspectRatio="xMidYMid slice" /></g>
      <text v-if="model.visible('categoryLegend') && model.categories.length" :x="model.infoFrame.x" :y="model.infoFrame.y + model.infoFrame.height - 12" font-size="12" fill="#78716c" role="button" tabindex="0" @click="emit('slotSelect', 'categoryLegend')">{{ model.categories.join(' · ') }}</text>
      <g v-if="model.visible('qr')" role="button" tabindex="0" :transform="`translate(${model.size.widthPx - model.size.widthPx * .09} ${model.size.heightPx - model.size.heightPx * .09})`" @click="emit('slotSelect', 'qr')"><text :x="-model.size.widthPx * .01" y="18" text-anchor="end" font-size="10" fill="#78716c">{{ model.qrLabel }}</text><rect :width="model.size.widthPx * .045" :height="model.size.widthPx * .045" fill="white" stroke="#78716c"/><path d="M5 5h15v15H5zM28 5h15v15H28zM5 28h15v15H5zM27 27h7v7h-7zM36 27h7v16h-7zM27 36h7v7h-7z" fill="#292524" /></g>
      <image v-if="model.visible('logo') && source.map.logoUrl" :href="source.map.logoUrl" :x="model.size.widthPx * .8" :y="model.size.heightPx * .035" :width="model.size.widthPx * .13" :height="model.size.heightPx * .06" preserveAspectRatio="xMaxYMid meet" role="button" tabindex="0" @click="emit('slotSelect', 'logo')" />
      <text v-if="model.visible('footer')" :x="model.mapFrame.x" :y="model.size.heightPx - model.size.heightPx * .03" font-size="11" fill="#78716c" role="button" tabindex="0" @click="emit('slotSelect', 'footer')">{{ model.footer }}</text>
    </svg>
      <button type="button" class="absolute z-10 rounded bg-transparent focus:outline focus:outline-4 focus:outline-sky-500" :style="overlayStyle({ x: model.mapFrame.x, y: model.size.heightPx * .025, width: model.size.widthPx * .6, height: model.size.heightPx * .085 })" aria-label="タイトルを編集" @click="emit('slotSelect', 'title')" />
      <button v-if="model.visible('spotGuide')" type="button" class="absolute z-10 rounded bg-transparent focus:outline focus:outline-4 focus:outline-sky-500" :style="overlayStyle(model.infoFrame)" aria-label="スポット案内を編集" @click="emit('slotSelect', 'spotGuide')" />
      <button v-if="model.visible('qr')" type="button" class="absolute z-20 rounded bg-transparent focus:outline focus:outline-4 focus:outline-sky-500" :style="overlayStyle({ x: model.size.widthPx * .83, y: model.size.heightPx * .84, width: model.size.widthPx * .13, height: model.size.heightPx * .13 })" aria-label="QR案内を編集" @click="emit('slotSelect', 'qr')" />
    </div>
  </div>
</template>
