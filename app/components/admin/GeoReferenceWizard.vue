<script setup lang="ts">
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Map as MapLibreMap, Marker } from 'maplibre-gl'
import { getGeoReferenceStep } from '~/composables/useGeoReference'
import type { LatLng } from '~~/lib/geo'
import type { GeoReferenceDraft } from '~~/shared/types/georeference'

const props = defineProps<{
  illustrationUrl: string
  imageWidth: number
  imageHeight: number
}>()

const draft = defineModel<GeoReferenceDraft>({ required: true })
const illustration = useTemplateRef<HTMLImageElement>('illustration')
const mapContainer = useTemplateRef<HTMLDivElement>('mapContainer')
const mapError = ref('')
const step = computed(() => getGeoReferenceStep(draft.value))
let map: MapLibreMap | undefined
let maplibre: typeof import('maplibre-gl') | undefined
let referenceMarkers: Marker[] = []

const stepTitle = computed(() => ({
  'a-image': '基準点A：イラストの目印を選ぶ',
  'a-map': '基準点A：実地図で同じ場所を選ぶ',
  'b-image': '基準点B：イラストの別の目印を選ぶ',
  'b-map': '基準点B：実地図で同じ場所を選ぶ',
  preview: '2点の指定が完了しました',
})[step.value])

const stepGuide = computed(() => ({
  'a-image': 'まずイラストの中の目印（鳥居や駅など分かりやすいもの）をクリックしてください。',
  'a-map': '次に、実際の地図上で同じ場所をクリックしてください。住所検索も使えます。',
  'b-image': '基準点Aからできるだけ離れた、別の分かりやすい目印をクリックしてください。',
  'b-map': '実際の地図上で同じ場所をクリックしてください。基準点Aから離れているほど精度が上がります。',
  preview: '対応点A・Bを確認し、次のプレビューでイラストの重なりを確認してください。',
})[step.value])

onMounted(async () => {
  if (!mapContainer.value) return

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
      maxBounds: [[-180, -85], [180, 85]],
      maxPitch: 0,
      dragRotate: false,
    })
    map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right')
    map.on('load', renderReferenceMarkers)
    map.on('click', (event) => {
      if (step.value === 'a-map') {
        draft.value.refALat = event.lngLat.lat
        draft.value.refALng = event.lngLat.lng
      }
      else if (step.value === 'b-map') {
        draft.value.refBLat = event.lngLat.lat
        draft.value.refBLng = event.lngLat.lng
      }
      else {
        return
      }
      renderReferenceMarkers()
    })
  }
  catch (error) {
    console.error('2点合わせ用地図の初期化に失敗しました。', error)
    mapError.value = '地図を初期化できませんでした。WebGLが有効か確認してください。'
  }
})

onBeforeUnmount(() => {
  clearReferenceMarkers()
  map?.remove()
  map = undefined
  maplibre = undefined
})

watch(draft, () => renderReferenceMarkers(), { deep: true })

function selectIllustrationPoint(event: MouseEvent) {
  if (!illustration.value || !['a-image', 'b-image'].includes(step.value)) return

  const bounds = illustration.value.getBoundingClientRect()
  const pixelX = clamp((event.clientX - bounds.left) / bounds.width * props.imageWidth, 0, props.imageWidth)
  const pixelY = clamp((event.clientY - bounds.top) / bounds.height * props.imageHeight, 0, props.imageHeight)

  if (step.value === 'a-image') {
    draft.value.refAPixelX = pixelX
    draft.value.refAPixelY = pixelY
  }
  else {
    draft.value.refBPixelX = pixelX
    draft.value.refBPixelY = pixelY
  }
}

function resetPoint(point: 'a' | 'b') {
  if (point === 'a') {
    Object.assign(draft.value, {
      refAPixelX: null,
      refAPixelY: null,
      refALat: null,
      refALng: null,
      refBPixelX: null,
      refBPixelY: null,
      refBLat: null,
      refBLng: null,
    })
  }
  else {
    Object.assign(draft.value, {
      refBPixelX: null,
      refBPixelY: null,
      refBLat: null,
      refBLng: null,
    })
  }
  renderReferenceMarkers()
}

function markerStyle(pixelX: number | null, pixelY: number | null) {
  if (pixelX === null || pixelY === null) return { display: 'none' }
  return {
    left: `${pixelX / props.imageWidth * 100}%`,
    top: `${pixelY / props.imageHeight * 100}%`,
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

function focusLocation(position: LatLng) {
  map?.easeTo({ center: [position.lng, position.lat], zoom: 17, duration: 600 })
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

defineExpose({ focusLocation })
</script>

<template>
  <div>
    <div class="rounded-xl border border-terracotta-200 bg-terracotta-50 px-4 py-4">
      <p class="text-xs font-bold uppercase tracking-wide text-terracotta-700">{{ stepTitle }}</p>
      <p class="mt-1 text-sm font-semibold leading-6 text-stone-900">{{ stepGuide }}</p>
    </div>

    <ol class="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
      <li v-for="(label, index) in ['A：イラスト', 'A：実地図', 'B：イラスト', 'B：実地図']" :key="label" class="rounded-lg px-3 py-2 text-center font-semibold" :class="index < ['a-image', 'a-map', 'b-image', 'b-map', 'preview'].indexOf(step) ? 'bg-emerald-100 text-emerald-800' : index === ['a-image', 'a-map', 'b-image', 'b-map'].indexOf(step) ? 'bg-terracotta-600 text-white' : 'bg-stone-100 text-stone-500'">
        {{ label }}
      </li>
    </ol>

    <div class="mt-5 grid gap-5 xl:grid-cols-2">
      <section>
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-sm font-bold text-stone-900">1. イラスト上の目印</h2>
          <div class="flex gap-2">
            <button v-if="draft.refAPixelX !== null" type="button" class="text-xs font-semibold text-stone-500 hover:text-stone-900" @click="resetPoint('a')">Aを選び直す</button>
            <button v-if="draft.refBPixelX !== null" type="button" class="text-xs font-semibold text-stone-500 hover:text-stone-900" @click="resetPoint('b')">Bを選び直す</button>
          </div>
        </div>
        <div class="mt-2 overflow-auto rounded-xl border border-stone-300 bg-stone-100 p-2 text-center">
          <div class="relative inline-block max-w-full">
            <img ref="illustration" :src="illustrationUrl" alt="基準点を選ぶフロアイラスト" class="block max-h-[36rem] max-w-full cursor-crosshair object-contain" @click="selectIllustrationPoint">
            <span class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-terracotta-600 px-2 py-1 text-xs font-bold text-white shadow" :style="markerStyle(draft.refAPixelX, draft.refAPixelY)">A</span>
            <span class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-sky-600 px-2 py-1 text-xs font-bold text-white shadow" :style="markerStyle(draft.refBPixelX, draft.refBPixelY)">B</span>
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-sm font-bold text-stone-900">2. 実地図上の同じ場所</h2>
        <div class="relative mt-2 overflow-hidden rounded-xl border border-stone-300 bg-stone-100">
          <div ref="mapContainer" class="h-[36rem] w-full" aria-label="基準点を選ぶ実地図" />
          <div v-if="step === 'a-map' || step === 'b-map'" class="pointer-events-none absolute bottom-3 left-3 right-3 rounded-lg bg-white/95 px-4 py-3 text-center text-sm font-semibold text-stone-800 shadow">
            十字カーソルで同じ場所をクリックしてください
          </div>
        </div>
        <p v-if="mapError" role="alert" class="mt-2 text-sm text-red-600">{{ mapError }}</p>
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
