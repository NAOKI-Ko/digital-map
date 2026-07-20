import { onBeforeUnmount, onMounted, readonly, ref, shallowRef, type Ref } from 'vue'
import type { Map as MapLibreMap, MapOptions, StyleSpecification } from 'maplibre-gl'
import { getFloorGeoReference, getGeoReferenceBounds, toImageCoordinates } from '~~/lib/geo'
import type { MapViewerFloor } from '~~/shared/types/map-viewer'

export type MapViewerMode = 'view' | 'edit'

export interface UseMapViewerOptions {
  mode: MapViewerMode
  floor: Readonly<Ref<MapViewerFloor>>
  onReady?: (map: MapLibreMap) => void
}

export function createMapViewerStyle(mode: MapViewerMode): StyleSpecification {
  if (mode === 'edit') {
    return {
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
    }
  }

  return {
    version: 8,
    sources: {},
    layers: [{
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#f5f5f4' },
    }],
  }
}

export function createInitialMapOptions(container: HTMLElement, mode: MapViewerMode): MapOptions {
  return {
    container,
    style: createMapViewerStyle(mode),
    center: [0, 0],
    zoom: 1,
  }
}

export function useMapViewer(
  container: Readonly<Ref<HTMLElement | null>>,
  options: UseMapViewerOptions,
) {
  const map = shallowRef<MapLibreMap | null>(null)
  const mapError = ref('')
  const floorError = ref('')
  const isReady = ref(false)

  async function initialize() {
    if (!container.value || map.value) return

    try {
      const [maplibregl] = await Promise.all([
        import('maplibre-gl'),
        import('maplibre-gl/dist/maplibre-gl.css'),
      ])
      const instance = new maplibregl.Map(createInitialMapOptions(container.value, options.mode))
      map.value = instance

      instance.once('load', () => {
        if (map.value !== instance) return
        isReady.value = true
        showFloor(options.floor.value)
        options.onReady?.(instance)
      })
    }
    catch {
      mapError.value = '地図を初期化できませんでした。WebGLが有効か確認してください。'
      destroy()
    }
  }

  function destroy() {
    map.value?.remove()
    map.value = null
    isReady.value = false
  }

  function showFloor(floor: MapViewerFloor) {
    const instance = map.value
    const coordinates = getFloorGeoReference(floor)
    if (!instance || !isReady.value) return false

    if (!coordinates) {
      floorError.value = 'このフロアはイラストの四隅座標が未設定、または正しくありません。'
      return false
    }

    floorError.value = ''
    const sourceId = `floor-${floor.id}`
    const layerId = `${sourceId}-layer`
    instance.addSource(sourceId, {
      type: 'image',
      url: floor.illustrationUrl,
      coordinates: toImageCoordinates(coordinates),
    })
    instance.addLayer({
      id: layerId,
      type: 'raster',
      source: sourceId,
      paint: { 'raster-opacity': options.mode === 'edit' ? 0.82 : 1 },
    })

    const bounds = getGeoReferenceBounds(coordinates)
    if (bounds) {
      instance.fitBounds([bounds.southwest, bounds.northeast], {
        padding: 64,
        maxZoom: 20,
        duration: 0,
      })
    }
    return true
  }

  onMounted(initialize)
  onBeforeUnmount(destroy)

  return {
    map: readonly(map),
    mapError: readonly(mapError),
    floorError: readonly(floorError),
    isReady: readonly(isReady),
    initialize,
    destroy,
    showFloor,
  }
}
