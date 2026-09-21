import type { PaperMapConfig } from '../schemas/paper-map'

export interface PaperRect { x: number, y: number, width: number, height: number }
export interface PaperPoint { x: number, y: number }

const MM_TO_POINTS = 72 / 25.4
const PAPER_MM = { A4: [210, 297], A3: [297, 420] } as const

export function paperPageSize(paper: PaperMapConfig['paper'], orientation: PaperMapConfig['orientation'], dpi = 300) {
  const [short, long] = PAPER_MM[paper]
  const [widthMm, heightMm] = orientation === 'portrait' ? [short, long] : [long, short]
  return { widthMm, heightMm, widthPoints: widthMm * MM_TO_POINTS, heightPoints: heightMm * MM_TO_POINTS, widthPx: Math.round(widthMm / 25.4 * dpi), heightPx: Math.round(heightMm / 25.4 * dpi) }
}

export function containRect(sourceWidth: number, sourceHeight: number, target: PaperRect): PaperRect {
  const scale = Math.min(target.width / sourceWidth, target.height / sourceHeight)
  const width = sourceWidth * scale
  const height = sourceHeight * scale
  return { x: target.x + (target.width - width) / 2, y: target.y + (target.height - height) / 2, width, height }
}

export function viewportPoint(point: PaperPoint, viewport: { x: number, y: number, width: number, height: number }, rect: PaperRect): PaperPoint {
  return { x: rect.x + ((point.x - viewport.x) / viewport.width) * rect.width, y: rect.y + ((point.y - viewport.y) / viewport.height) * rect.height }
}

export function resolveViewport(config: PaperMapConfig, points: PaperPoint[]) {
  if (config.viewport.mode === 'custom') return config.viewport
  if (config.viewport.mode === 'fit_spots' && points.length) {
    const xs = points.map(point => point.x), ys = points.map(point => point.y)
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
    const padding = 0.08
    const x = Math.max(0, minX - padding), y = Math.max(0, minY - padding)
    return { x, y, width: Math.min(1 - x, Math.max(0.2, maxX - minX + padding * 2)), height: Math.min(1 - y, Math.max(0.2, maxY - minY + padding * 2)) }
  }
  return { x: 0, y: 0, width: 1, height: 1 }
}

export function resolvePaperLayout(config: PaperMapConfig, width: number, height: number) {
  const margin = width * 0.045
  const header = height * 0.12
  const footer = height * 0.07
  const content: PaperRect = { x: margin, y: margin + header, width: width - margin * 2, height: height - margin * 2 - header - footer }
  const baseRatio = config.mapSize === 'large' ? 0.76 : config.mapSize === 'info' ? 0.48 : 0.62
  const layoutAdjustment = config.layout === 'MAP_FOCUS' ? 0.06 : config.layout === 'GUIDE' ? -0.06 : 0
  const mapRatio = Math.max(0.4, Math.min(0.82, baseRatio + layoutAdjustment))
  if (config.orientation === 'landscape') {
    const mapFrame = { ...content, width: content.width * mapRatio }
    return { margin, header, footer, content, mapFrame, infoFrame: { x: mapFrame.x + mapFrame.width + margin * 0.55, y: content.y, width: content.width - mapFrame.width - margin * 0.55, height: content.height } }
  }
  const mapFrame = { ...content, height: content.height * mapRatio }
  return { margin, header, footer, content, mapFrame, infoFrame: { x: content.x, y: mapFrame.y + mapFrame.height + margin * 0.55, width: content.width, height: content.height - mapFrame.height - margin * 0.55 } }
}
