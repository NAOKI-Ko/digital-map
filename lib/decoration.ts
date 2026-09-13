import type { FloorGeoReferenceFields, ImagePosition, MapLibreImageCoordinates } from './geo'
import { imageToRenderCoordinates } from './geo'
import type { MapViewerDecoration } from '../shared/types/map-viewer'

export function getDecorationImageCorners(floor: FloorGeoReferenceFields, decoration: MapViewerDecoration): [ImagePosition, ImagePosition, ImagePosition, ImagePosition] | null {
  if (!floor.imageWidth || !floor.imageHeight || decoration.imageWidth <= 0 || decoration.imageHeight <= 0) return null
  const halfWidth = decoration.width / 2
  const halfHeight = decoration.width * (decoration.imageHeight / decoration.imageWidth) * (floor.imageWidth / floor.imageHeight) / 2
  const radians = decoration.rotation * Math.PI / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const rotate = (dx: number, dy: number) => ({ x: decoration.x + dx * cos - dy * sin, y: decoration.y + dx * sin + dy * cos })
  return [rotate(-halfWidth, -halfHeight), rotate(halfWidth, -halfHeight), rotate(halfWidth, halfHeight), rotate(-halfWidth, halfHeight)]
}

export function getDecorationRenderCoordinates(floor: FloorGeoReferenceFields, decoration: MapViewerDecoration): MapLibreImageCoordinates | null {
  const corners = getDecorationImageCorners(floor, decoration)
  if (!corners) return null
  const rendered = corners.map(corner => imageToRenderCoordinates(floor, corner))
  if (rendered.some(value => value === null)) return null
  return rendered.map(value => [value!.lng, value!.lat]) as MapLibreImageCoordinates
}
