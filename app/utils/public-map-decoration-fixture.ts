import type { MapViewerDecoration } from '~~/shared/types/map-viewer'

/** Original abstract QA drawings. Never merged into a public release or persisted. */
export function createPublicMapDecorationFixture(): MapViewerDecoration[] {
  const root = '/__qa__/public-map-decorations/'
  return [
    { id: 'qa-ground', imageUrl: `${root}fixture-ground.png`, imageWidth: 160, imageHeight: 100, x: 0.17, y: 0.76, width: 0.12, rotation: -12, order: 10 },
    { id: 'qa-tree', imageUrl: `${root}fixture-tree.png`, imageWidth: 120, imageHeight: 160, x: 0.79, y: 0.7, width: 0.075, rotation: 0, order: 11 },
    { id: 'qa-building-edge', imageUrl: `${root}fixture-building.png`, imageWidth: 180, imageHeight: 160, x: 0.96, y: 0.28, width: 0.12, rotation: 18, order: 12 },
    { id: 'qa-padded-tree', imageUrl: `${root}fixture-tree-padded.png`, imageWidth: 320, imageHeight: 320, x: 0.81, y: 0.88, width: 0.12, rotation: 0, order: 13 },
  ]
}
