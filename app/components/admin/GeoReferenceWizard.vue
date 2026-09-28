<script setup lang="ts">
import 'maplibre-gl/dist/maplibre-gl.css'
import type { ImageSource, Map as MapLibreMap, Marker } from 'maplibre-gl'
import { getGeoReferenceStep, nudgeGeoReferenceImagePoint, selectGeoReferenceImagePoint, selectGeoReferenceMapPoint } from '~/composables/useGeoReference'
import {
  computeFloorCorners,
  getGeoReferenceBounds,
  toImageCoordinates,
  type CompleteFloorGeoReference,
  type LatLng,
} from '~~/lib/geo'
import type { GeoReferenceDraft } from '~~/shared/types/georeference'

const props = defineProps<{
  illustrationUrl: string
  imageWidth: number
  imageHeight: number
}>()

const draft = defineModel<GeoReferenceDraft>({ required: true })
const illustration = useTemplateRef<HTMLImageElement>('illustration')
const illustrationSurface = useTemplateRef<HTMLDivElement>('illustrationSurface')
const stepStatus = useTemplateRef<HTMLParagraphElement>('stepStatus')
const mapContainer = useTemplateRef<HTMLDivElement>('mapContainer')
const mapError = ref('')
const previewError = ref('')
const previewReady = ref(false)
const previewOpacity = ref(0.55)
const imageZoom = ref(1)
const step = computed(() => getGeoReferenceStep(draft.value))
const mapCenter = ref<LatLng | null>(null)
const imagePointToEdit = computed<'a' | 'b' | null>(() => step.value.startsWith('a-') ? 'a' : step.value.startsWith('b-') ? 'b' : null)
const mapPointToSelect = computed<'a' | 'b' | null>(() => step.value === 'a-map' ? 'a' : step.value === 'b-map' ? 'b' : null)
const imagePointDescription = computed(() => {
  const point = imagePointToEdit.value
  if (!point) return 'AまたはBを選び直すと調整できます。'
  const x = point === 'a' ? draft.value.refAImageX : draft.value.refBImageX
  const y = point === 'a' ? draft.value.refAImageY : draft.value.refBImageY
  return x === null || y === null
    ? `地点${point.toUpperCase()}は未選択です。Enterキーで中央に置くか、矢印キーで中央から調整できます。`
    : `地点${point.toUpperCase()}はイラストの左から${Math.round(x * 100)}%、上から${Math.round(y * 100)}%です。矢印キーで調整できます。`
})
const mapCenterDescription = computed(() => mapCenter.value
  ? `地図中央：北緯${mapCenter.value.lat.toFixed(5)}度、東経${mapCenter.value.lng.toFixed(5)}度。`
  : '地図を準備しています。')
let map: MapLibreMap | undefined
let maplibre: typeof import('maplibre-gl') | undefined
let referenceMarkers: Marker[] = []
let lastPreviewSignature = ''
let mapResizeObserver: ResizeObserver | null = null

const PREVIEW_SOURCE_ID = 'georeference-preview'
const PREVIEW_LAYER_ID = 'georeference-preview-layer'

function resizeMap() {
  map?.resize()
}

const stepTitle = computed(() => ({
  'a-image': '基準点A：イラストの目印を選ぶ',
  'a-map': '基準点A：実地図で同じ場所を選ぶ',
  'b-image': '基準点B：イラストの別の目印を選ぶ',
  'b-map': '基準点B：実地図で同じ場所を選ぶ',
  preview: '2点の指定が完了しました',
})[step.value])

const stepGuide = computed(() => ({
  'a-image': 'まずイラストの目印をクリックするか、イラストにフォーカスしてEnterキーで中央に置き、矢印キーで調整してください。',
  'a-map': '実地図で同じ場所をクリックするか、住所検索と地図中央の操作で場所を合わせて設定してください。',
  'b-image': 'Aから離れた別の目印をクリックするか、イラストのキーボード操作で選んでください。',
  'b-map': '実地図で同じ場所をクリックするか、地図中央を調整して設定してください。',
  preview: '対応点A・Bを確認し、次のプレビューでイラストの重なりを確認してください。',
})[step.value])

onMounted(async () => {
  if (!mapContainer.value) return

  window.addEventListener('admin-sidebar-resize', resizeMap)
  if (typeof ResizeObserver !== 'undefined') {
    mapResizeObserver = new ResizeObserver(resizeMap)
    mapResizeObserver.observe(mapContainer.value)
  }

  try {
    maplibre = await import('maplibre-gl')
    map = new maplibre.Map({
      container: mapContainer.value,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: initialMapCenter(),
      zoom: hasAnyMapPoint() ? 15 : 5,
      renderWorldCopies: false,
      maxPitch: 0,
      dragRotate: false,
    })
    map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right')
    map.on('load', () => {
      updateMapCenter()
      renderReferenceMarkers()
      renderPreview()
    })
    map.on('move', updateMapCenter)
    map.on('click', (event) => {
      if (!mapPointToSelect.value) return
      chooseMapPoint(mapPointToSelect.value, event.lngLat.lat, event.lngLat.lng)
    })
  }
  catch (error) {
    console.error('2点合わせ用地図の初期化に失敗しました。', error)
    mapError.value = '地図を初期化できませんでした。WebGLが有効か確認してください。'
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('admin-sidebar-resize', resizeMap)
  mapResizeObserver?.disconnect()
  mapResizeObserver = null
  clearReferenceMarkers()
  map?.remove()
  map = undefined
  maplibre = undefined
})

watch(draft, () => {
  renderReferenceMarkers()
  renderPreview()
}, { deep: true })

watch(previewOpacity, (value) => {
  if (map?.getLayer(PREVIEW_LAYER_ID)) {
    map.setPaintProperty(PREVIEW_LAYER_ID, 'raster-opacity', value)
  }
})

function selectIllustrationPoint(event: MouseEvent) {
  if (!illustration.value || (step.value !== 'a-image' && step.value !== 'b-image')) return

  const bounds = illustration.value.getBoundingClientRect()
  const imageX = clamp((event.clientX - bounds.left) / bounds.width, 0, 1)
  const imageY = clamp((event.clientY - bounds.top) / bounds.height, 0, 1)

  draft.value = selectGeoReferenceImagePoint(draft.value, step.value === 'a-image' ? 'a' : 'b', imageX, imageY)
}

function initializeIllustrationPoint() {
  if (step.value !== 'a-image' && step.value !== 'b-image') return
  draft.value = selectGeoReferenceImagePoint(draft.value, step.value === 'a-image' ? 'a' : 'b', 0.5, 0.5)
}

function moveIllustrationPoint(dx: number, dy: number, shiftKey: boolean) {
  if (!imagePointToEdit.value) return
  const stepSize = shiftKey ? 0.02 : 0.005
  draft.value = nudgeGeoReferenceImagePoint(draft.value, imagePointToEdit.value, dx * stepSize, dy * stepSize)
}

function updateMapCenter() {
  if (!map) return
  const center = map.getCenter()
  mapCenter.value = { lat: center.lat, lng: center.lng }
}

function panMap(dx: number, dy: number, shiftKey: boolean) {
  const distance = shiftKey ? 120 : 30
  map?.panBy([dx * distance, dy * distance], { duration: 0 })
  updateMapCenter()
}

function chooseMapPoint(point: 'a' | 'b', lat: number, lng: number) {
  draft.value = selectGeoReferenceMapPoint(draft.value, point, lat, lng)
  renderReferenceMarkers()
  renderPreview()
}

function commitMapCenter() {
  if (!map || !mapPointToSelect.value) return
  const point = mapPointToSelect.value
  const center = map.getCenter()
  chooseMapPoint(point, center.lat, center.lng)
  nextTick(() => {
    if (point === 'a') illustrationSurface.value?.focus()
    else stepStatus.value?.focus()
  })
}

function resetPoint(point: 'a' | 'b') {
  if (point === 'a') {
    Object.assign(draft.value, {
      refAImageX: null,
      refAImageY: null,
      refALat: null,
      refALng: null,
      refBImageX: null,
      refBImageY: null,
      refBLat: null,
      refBLng: null,
    })
  }
  else {
    Object.assign(draft.value, {
      refBImageX: null,
      refBImageY: null,
      refBLat: null,
      refBLng: null,
    })
  }
  renderReferenceMarkers()
}

function markerStyle(imageX: number | null, imageY: number | null) {
  if (imageX === null || imageY === null) return { display: 'none' }
  return {
    left: `${imageX * 100}%`,
    top: `${imageY * 100}%`,
  }
}

function initialMapCenter(): [number, number] {
  const points = [
    draft.value.refALat !== null && draft.value.refALng !== null
      ? { lat: draft.value.refALat, lng: draft.value.refALng }
      : null,
    draft.value.refBLat !== null && draft.value.refBLng !== null
      ? { lat: draft.value.refBLat, lng: draft.value.refBLng }
      : null,
  ].filter((point): point is LatLng => point !== null)

  if (points.length === 0) return [138, 36]
  return [
    points.reduce((sum, point) => sum + point.lng, 0) / points.length,
    points.reduce((sum, point) => sum + point.lat, 0) / points.length,
  ]
}

function hasAnyMapPoint() {
  return draft.value.refALat !== null || draft.value.refBLat !== null
}

function renderReferenceMarkers() {
  if (!map || !maplibre || !map.isStyleLoaded()) return
  clearReferenceMarkers()

  const points = [
    { label: 'A', lat: draft.value.refALat, lng: draft.value.refALng },
    { label: 'B', lat: draft.value.refBLat, lng: draft.value.refBLng },
  ]

  for (const point of points) {
    if (point.lat === null || point.lng === null) continue
    const element = document.createElement('div')
    element.className = `geo-reference-point geo-reference-point-${point.label.toLowerCase()}`
    element.textContent = point.label
    referenceMarkers.push(new maplibre.Marker({ element })
      .setLngLat([point.lng, point.lat])
      .addTo(map))
  }
}

function clearReferenceMarkers() {
  referenceMarkers.forEach(marker => marker.remove())
  referenceMarkers = []
}

function renderPreview() {
  if (!map || !map.isStyleLoaded()) return
  const complete = completeGeoReference()
  if (!complete) {
    removePreview()
    return
  }

  try {
    const corners = computeFloorCorners(complete)
    const coordinates = toImageCoordinates(corners)
    const source = map.getSource(PREVIEW_SOURCE_ID) as ImageSource | undefined

    if (source) {
      source.setCoordinates(coordinates)
    }
    else {
      map.addSource(PREVIEW_SOURCE_ID, {
        type: 'image',
        url: props.illustrationUrl,
        coordinates,
      })
      map.addLayer({
        id: PREVIEW_LAYER_ID,
        type: 'raster',
        source: PREVIEW_SOURCE_ID,
        paint: { 'raster-opacity': previewOpacity.value },
      })
    }

    const signature = JSON.stringify(complete)
    if (signature !== lastPreviewSignature) {
      const bounds = getGeoReferenceBounds(corners)
      map.fitBounds([bounds.southwest, bounds.northeast], { padding: 64, maxZoom: 18, duration: 700 })
      lastPreviewSignature = signature
    }
    previewReady.value = true
    previewError.value = ''
  }
  catch (error) {
    removePreview()
    previewError.value = error instanceof Error ? error.message : 'プレビューを計算できませんでした。'
  }
}

function removePreview() {
  if (map?.getLayer(PREVIEW_LAYER_ID)) map.removeLayer(PREVIEW_LAYER_ID)
  if (map?.getSource(PREVIEW_SOURCE_ID)) map.removeSource(PREVIEW_SOURCE_ID)
  previewReady.value = false
  lastPreviewSignature = ''
}

function completeGeoReference(): CompleteFloorGeoReference | null {
  if (step.value !== 'preview') return null
  return {
    imageWidth: props.imageWidth,
    imageHeight: props.imageHeight,
    refAImageX: draft.value.refAImageX!,
    refAImageY: draft.value.refAImageY!,
    refALat: draft.value.refALat!,
    refALng: draft.value.refALng!,
    refBImageX: draft.value.refBImageX!,
    refBImageY: draft.value.refBImageY!,
    refBLat: draft.value.refBLat!,
    refBLng: draft.value.refBLng!,
  }
}

function focusLocation(position: LatLng) {
  map?.easeTo({ center: [position.lng, position.lat], zoom: 17, duration: 600 })
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function changeImageZoom(delta: number) {
  imageZoom.value = clamp(imageZoom.value + delta, 1, 4)
}

defineExpose({ focusLocation })
</script>

<template>
  <div>
    <div class="rounded-xl border border-terracotta-200 bg-terracotta-50 px-4 py-4">
      <p ref="stepStatus" tabindex="-1" class="text-xs font-bold uppercase tracking-wide text-terracotta-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-terracotta-500" role="status" aria-live="polite">{{ stepTitle }}</p>
      <p class="mt-1 text-sm font-semibold leading-6 text-stone-900">{{ stepGuide }}</p>
    </div>

    <ol class="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
      <li v-for="(label, index) in ['A：イラスト', 'A：実地図', 'B：イラスト', 'B：実地図']" :key="label" :aria-current="index === ['a-image', 'a-map', 'b-image', 'b-map'].indexOf(step) ? 'step' : undefined" class="rounded-lg px-3 py-2 text-center font-semibold" :class="index < ['a-image', 'a-map', 'b-image', 'b-map', 'preview'].indexOf(step) ? 'bg-emerald-100 text-emerald-800' : index === ['a-image', 'a-map', 'b-image', 'b-map'].indexOf(step) ? 'bg-terracotta-600 text-white' : 'bg-stone-100 text-stone-500'">
        {{ label }}<span class="sr-only">{{ index < ['a-image', 'a-map', 'b-image', 'b-map', 'preview'].indexOf(step) ? '、完了' : index === ['a-image', 'a-map', 'b-image', 'b-map'].indexOf(step) ? '、現在の手順' : '、未完了' }}</span>
      </li>
    </ol>

    <div class="mt-5 grid gap-5 xl:grid-cols-2">
      <section>
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-sm font-bold text-stone-900">1. イラスト上の目印</h2>
          <div class="flex flex-wrap items-center justify-end gap-2">
            <button type="button" :disabled="imageZoom <= 1" aria-label="イラストを縮小" class="rounded border border-stone-300 px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-terracotta-500 disabled:opacity-40" @click="changeImageZoom(-0.5)">−</button>
            <span class="text-xs text-stone-500">{{ Math.round(imageZoom * 100) }}%</span>
            <button type="button" :disabled="imageZoom >= 4" aria-label="イラストを拡大" class="rounded border border-stone-300 px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-terracotta-500 disabled:opacity-40" @click="changeImageZoom(0.5)">＋</button>
            <button v-if="draft.refAImageX !== null" type="button" class="text-xs font-semibold text-stone-500 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-terracotta-500" @click="resetPoint('a')">Aを選び直す</button>
            <button v-if="draft.refBImageX !== null" type="button" class="text-xs font-semibold text-stone-500 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-terracotta-500" @click="resetPoint('b')">Bを選び直す</button>
          </div>
        </div>
        <div class="mt-2 overflow-auto rounded-xl border border-stone-300 bg-stone-100 p-2 text-center">
          <div ref="illustrationSurface" class="relative inline-block rounded focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-terracotta-500" :style="{ width: `${imageZoom * 100}%` }" :tabindex="imagePointToEdit ? 0 : -1" :role="imagePointToEdit ? 'button' : 'img'" :aria-label="`フロアイラスト。${imagePointDescription}`" @click="selectIllustrationPoint" @keydown.enter.prevent="initializeIllustrationPoint" @keydown.space.prevent="initializeIllustrationPoint" @keydown.left.prevent="moveIllustrationPoint(-1, 0, $event.shiftKey)" @keydown.right.prevent="moveIllustrationPoint(1, 0, $event.shiftKey)" @keydown.up.prevent="moveIllustrationPoint(0, -1, $event.shiftKey)" @keydown.down.prevent="moveIllustrationPoint(0, 1, $event.shiftKey)">
            <img ref="illustration" :src="illustrationUrl" alt="" class="block h-auto w-full cursor-crosshair object-contain">
            <span class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-terracotta-600 px-2 py-1 text-xs font-bold text-white shadow" :style="markerStyle(draft.refAImageX, draft.refAImageY)">A</span>
            <span class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-sky-600 px-2 py-1 text-xs font-bold text-white shadow" :style="markerStyle(draft.refBImageX, draft.refBImageY)">B</span>
          </div>
        </div>
        <p v-if="imagePointToEdit" class="mt-2 text-xs leading-5 text-stone-600" role="status">{{ imagePointDescription }} Shift＋矢印キーで大きく動かせます。</p>
      </section>

      <section>
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-sm font-bold text-stone-900">2. 実地図上の同じ場所</h2>
          <span v-if="previewReady" class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">半透明プレビュー表示中</span>
        </div>
        <div class="relative mt-2 overflow-hidden rounded-xl border border-stone-300 bg-stone-100">
          <div ref="mapContainer" class="h-[36rem] w-full" aria-label="基準点を選ぶ実地図" />
          <div v-if="mapPointToSelect" aria-hidden="true" class="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-3xl font-bold text-terracotta-700 [text-shadow:0_1px_2px_white,1px_0_2px_white,-1px_0_2px_white]">＋</div>
          <div v-if="step === 'a-map' || step === 'b-map'" class="pointer-events-none absolute bottom-3 left-3 right-3 rounded-lg bg-white/95 px-4 py-3 text-center text-sm font-semibold text-stone-800 shadow">
            地図をクリックするか、中央の十字を目印にキーボードで地図を動かしてください
          </div>
        </div>
        <div v-if="mapPointToSelect" class="mt-3 rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700">
          <p>住所検索で近くへ移動できます。次の操作欄にフォーカスして矢印キーで地図中央を動かし、同じ目印に合わせて設定してください。Shift＋矢印キーで大きく動かせます。</p>
          <div tabindex="0" role="group" :aria-label="`地点${mapPointToSelect.toUpperCase()}の地図中央を動かす。矢印キーで移動、Shiftキーで大きく移動`" class="mt-2 rounded border border-stone-300 bg-white px-3 py-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-terracotta-500" @keydown.left.prevent="panMap(-1, 0, $event.shiftKey)" @keydown.right.prevent="panMap(1, 0, $event.shiftKey)" @keydown.up.prevent="panMap(0, -1, $event.shiftKey)" @keydown.down.prevent="panMap(0, 1, $event.shiftKey)">矢印キーで地図中央を動かす</div>
          <p class="mt-2 text-xs" role="status">{{ mapCenterDescription }}</p>
          <button type="button" :disabled="!mapCenter" class="mt-3 min-h-11 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-terracotta-500 disabled:opacity-50" @click="commitMapCenter">現在の地図中央を地点{{ mapPointToSelect.toUpperCase() }}に設定</button>
        </div>
        <p v-if="mapError" role="alert" class="mt-2 text-sm text-red-600">{{ mapError }}</p>
        <p v-if="previewError" role="alert" class="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{{ previewError }}</p>
        <p v-if="previewReady" class="mt-2 text-xs leading-5 text-stone-600">半透明のイラストと道路・建物の重なりを確認し、大きくずれている場合はAまたはBを選び直してください。</p>
        <label v-if="previewReady" class="mt-3 flex items-center gap-3 text-xs font-semibold text-stone-700">
          重ね合わせの濃さ
          <input v-model.number="previewOpacity" type="range" min="0.1" max="0.9" step="0.05" class="flex-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-terracotta-500" aria-label="重ね合わせの濃さ">
          <span class="w-10 text-right">{{ Math.round(previewOpacity * 100) }}%</span>
        </label>
      </section>
    </div>
  </div>
</template>

<style>
.geo-reference-point {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border: 2px solid white;
  border-radius: 9999px;
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  box-shadow: 0 2px 8px rgb(0 0 0 / 35%);
}

.geo-reference-point-a { background: #c2410c; }
.geo-reference-point-b { background: #0284c7; }
</style>
