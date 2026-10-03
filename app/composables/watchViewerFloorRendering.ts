import { watch, type Ref } from 'vue'
import type { MapViewerFloor } from '~~/shared/types/map-viewer'

function geometryKey(floor: MapViewerFloor) {
  return JSON.stringify([
    floor.id, floor.imageWidth, floor.imageHeight,
    floor.refAImageX, floor.refAImageY, floor.refALat, floor.refALng,
    floor.refBImageX, floor.refBImageY, floor.refBLat, floor.refBLng,
  ])
}

/** Retained visitor renderers must refresh resources without refitting for translations. */
export function watchViewerFloorRendering(
  floor: Readonly<Ref<MapViewerFloor>>,
  visitor: () => boolean,
  refresh: (floor: MapViewerFloor, refit: boolean) => void,
) {
  return watch([
    () => visitor() ? geometryKey(floor.value) : floor.value.id,
    () => visitor() ? floor.value.illustrationUrl : '',
  ], ([geometry], [previousGeometry]) => {
    refresh(floor.value, geometry !== previousGeometry)
  }, { flush: 'post' })
}
