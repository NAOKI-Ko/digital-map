import { onBeforeUnmount, onMounted, readonly, ref, shallowRef, type Ref } from 'vue'
import type { Map as MapLibreMap, MapOptions, StyleSpecification } from 'maplibre-gl'

export type MapViewerMode = 'view' | 'edit'

export interface UseMapViewerOptions {
  mode: MapViewerMode
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

  onMounted(initialize)
  onBeforeUnmount(destroy)

  return {
    map: readonly(map),
    mapError: readonly(mapError),
    isReady: readonly(isReady),
    initialize,
    destroy,
  }
}
