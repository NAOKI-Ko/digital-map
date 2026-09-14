import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import QRCode from 'qrcode'
import sharp, { type OverlayOptions } from 'sharp'
import type { PublicFloor, PublicMap } from '~~/shared/types/public-map'
import type { MapPdfRequest } from '~~/shared/schemas/map-pdf'
import type { PublicObjectStorage } from './public-storage'

const MM_TO_POINTS = 72 / 25.4
const DPI = 300
const PAPER_MM = { A4: [210, 297], A3: [297, 420] } as const
const LEGEND_PER_MAIN_PAGE = 18
const LEGEND_PER_EXTRA_PAGE = 38

export function pdfPageSize(paper: MapPdfRequest['paper'], orientation: MapPdfRequest['orientation']) {
  const [short, long] = PAPER_MM[paper]
  const [widthMm, heightMm] = orientation === 'portrait' ? [short, long] : [long, short]
  return { widthMm, heightMm, widthPoints: widthMm * MM_TO_POINTS, heightPoints: heightMm * MM_TO_POINTS, widthPx: Math.round(widthMm / 25.4 * DPI), heightPx: Math.round(heightMm / 25.4 * DPI) }
}

export function publicMapQrPayload(publicBaseUrl: string, slug: string) {
  return new URL(`/${encodeURIComponent(slug)}`, publicBaseUrl.endsWith('/') ? publicBaseUrl : `${publicBaseUrl}/`).toString()
}

export function normalizedImageToPage(value: number, offset: number, extent: number) {
  return offset + value * extent
}

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]!)
}

export async function readMapAsset(url: string | null, uploadDirectory: string, storage: PublicObjectStorage) {
  if (!url) return null
  if (url.startsWith('/uploads/')) return readFile(resolve(uploadDirectory, url.slice('/uploads/'.length))).catch(() => null)
  const prefix = '/api/public-assets/'
  if (url.startsWith(prefix)) return storage.get(`public/maps/${url.slice(prefix.length)}`).then(value => value ? Buffer.from(value.bytes) : null)
  return null
}

function numberedSpots(floor: PublicFloor) {
  return [...floor.spots].sort((left, right) => left.name.localeCompare(right.name, 'ja') || left.id.localeCompare(right.id)).map((spot, index) => ({ ...spot, number: index + 1 }))
}

function floorCategories(floor: PublicFloor) {
  const categories = new Map<string, string>()
  for (const spot of floor.spots) for (const category of spot.categories) categories.set(category.id, category.name)
  return [...categories.entries()].sort((left, right) => left[1].localeCompare(right[1], 'ja')).map(([id, name]) => ({ id, name }))
}

function svgTextLines(items: string[], x: number, y: number, fontSize: number, lineHeight: number) {
  return items.map((item, index) => `<text x="${x}" y="${y + index * lineHeight}" font-size="${fontSize}" fill="#292524">${escapeXml(item)}</text>`).join('')
}

async function renderFloorPage(map: PublicMap, floor: PublicFloor, request: MapPdfRequest, options: { preview: boolean, publicBaseUrl: string, uploadDirectory: string, storage: PublicObjectStorage }) {
  const size = pdfPageSize(request.paper, request.orientation)
  const margin = Math.round(size.widthPx * 0.035)
  const header = Math.round(size.heightPx * 0.11)
  const footer = Math.round(size.heightPx * 0.055)
  const legendWidth = request.orientation === 'landscape' ? Math.round(size.widthPx * 0.22) : 0
  const mapWidth = size.widthPx - margin * 2 - legendWidth
  const mapHeight = size.heightPx - margin * 2 - header - footer - (request.orientation === 'portrait' ? Math.round(size.heightPx * 0.18) : 0)
  const top = margin + header
  const background = await readMapAsset(floor.illustrationUrl, options.uploadDirectory, options.storage)
  const page = sharp({ create: { width: size.widthPx, height: size.heightPx, channels: 3, background: '#ffffff' } })
  const composites: OverlayOptions[] = []
  const logo = await readMapAsset(map.logoUrl, options.uploadDirectory, options.storage)
  if (logo) {
    const preparedLogo = await sharp(logo).resize({ height: Math.round(header * 0.55), width: Math.round(size.widthPx * 0.16), fit: 'inside', withoutEnlargement: true }).png().toBuffer()
    const logoMetadata = await sharp(preparedLogo).metadata()
    composites.push({ input: preparedLogo, left: size.widthPx - margin - (logoMetadata.width ?? 1), top: margin })
  }
  if (background) {
    const prepared = await sharp(background).resize(mapWidth, mapHeight, { fit: 'contain', background: '#f5f5f4' }).jpeg({ quality: 92 }).toBuffer()
    composites.push({ input: prepared, left: margin, top })
  }
  else {
    const placeholder = Buffer.from(`<svg width="${mapWidth}" height="${mapHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f5f5f4"/><text x="50%" y="50%" text-anchor="middle" font-size="48" fill="#78716c">Floor image unavailable</text></svg>`)
    composites.push({ input: placeholder, left: margin, top })
  }
  for (const decoration of floor.decorations) {
    const bytes = await readMapAsset(decoration.imageUrl, options.uploadDirectory, options.storage)
    if (!bytes) continue
    const width = Math.max(1, Math.round(decoration.width * mapWidth))
    const image = await sharp(bytes).resize({ width, withoutEnlargement: true }).rotate(decoration.rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
    const metadata = await sharp(image).metadata()
    composites.push({ input: image, left: Math.max(margin, Math.round(normalizedImageToPage(decoration.x, margin, mapWidth) - (metadata.width ?? width) / 2)), top: Math.max(top, Math.round(normalizedImageToPage(decoration.y, top, mapHeight) - (metadata.height ?? width) / 2)) })
  }
  const spots = numberedSpots(floor)
  const categories = floorCategories(floor)
  const markerSvg = spots.map(spot => {
    const x = normalizedImageToPage(spot.x, margin, mapWidth)
    const y = normalizedImageToPage(spot.y, top, mapHeight)
    return `<g><circle cx="${x}" cy="${y}" r="25" fill="${escapeXml(spot.pinColor || '#c2412d')}" stroke="#ffffff" stroke-width="6"/><text x="${x}" y="${y + 9}" text-anchor="middle" font-size="26" font-weight="700" fill="#ffffff">${spot.number}</text></g>`
  }).join('')
  const legendX = request.orientation === 'landscape' ? margin + mapWidth + Math.round(size.widthPx * 0.025) : margin
  const legendY = request.orientation === 'landscape' ? top + 40 : top + mapHeight + 70
  const legend = [
    ...spots.slice(0, LEGEND_PER_MAIN_PAGE).map(spot => `${spot.number}. ${spot.name}`),
    ...categories.slice(0, 8).map(category => `• ${category.name}`),
  ]
  const titleSize = Math.round(size.widthPx * 0.018)
  const overlay = Buffer.from(`<svg width="${size.widthPx}" height="${size.heightPx}" xmlns="http://www.w3.org/2000/svg"><style>text{font-family:-apple-system,BlinkMacSystemFont,'Noto Sans CJK JP','Hiragino Sans','Yu Gothic',sans-serif}</style><text x="${margin}" y="${margin + titleSize}" font-size="${titleSize}" font-weight="700" fill="#1c1917">${escapeXml(map.name)}</text><text x="${margin}" y="${margin + titleSize + 48}" font-size="30" fill="#57534e">${escapeXml([map.organizationName, floor.name].filter(Boolean).join(' / '))}</text>${options.preview ? `<rect x="${size.widthPx - margin - 420}" y="${margin}" width="420" height="72" rx="18" fill="#fef3c7"/><text x="${size.widthPx - margin - 210}" y="${margin + 49}" text-anchor="middle" font-size="34" font-weight="700" fill="#92400e">未公開プレビュー</text>` : ''}${markerSvg}<text x="${legendX}" y="${legendY - 42}" font-size="34" font-weight="700" fill="#1c1917">スポット・カテゴリ</text>${svgTextLines(legend, legendX, legendY, 28, 46)}<text x="${margin}" y="${size.heightPx - margin}" font-size="25" fill="#78716c">番号順: スポット名（日本語）・IDの安定順</text></svg>`)
  composites.push({ input: overlay, left: 0, top: 0 })
  if (!options.preview) {
    const qr = await QRCode.toBuffer(publicMapQrPayload(options.publicBaseUrl, map.slug), { errorCorrectionLevel: 'M', margin: 1, width: 360 })
    composites.push({ input: qr, left: size.widthPx - margin - 360, top: size.heightPx - margin - 360 })
  }
  return { jpeg: await page.composite(composites).jpeg({ quality: 92 }).toBuffer(), overflow: spots.slice(LEGEND_PER_MAIN_PAGE).map(spot => `${spot.number}. ${spot.name}`), size }
}

async function renderLegendPage(map: PublicMap, floor: PublicFloor, lines: string[], request: MapPdfRequest) {
  const size = pdfPageSize(request.paper, request.orientation)
  const margin = Math.round(size.widthPx * 0.06)
  const chunks = Array.from({ length: Math.ceil(lines.length / LEGEND_PER_EXTRA_PAGE) }, (_, index) => lines.slice(index * LEGEND_PER_EXTRA_PAGE, (index + 1) * LEGEND_PER_EXTRA_PAGE))
  return Promise.all(chunks.map(async (chunk, pageIndex) => {
    const svg = Buffer.from(`<svg width="${size.widthPx}" height="${size.heightPx}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffffff"/><style>text{font-family:-apple-system,BlinkMacSystemFont,'Noto Sans CJK JP','Hiragino Sans','Yu Gothic',sans-serif}</style><text x="${margin}" y="${margin + 70}" font-size="58" font-weight="700" fill="#1c1917">${escapeXml(map.name)} - ${escapeXml(floor.name)}</text><text x="${margin}" y="${margin + 145}" font-size="38" fill="#57534e">スポット凡例 ${pageIndex + 2}</text>${svgTextLines(chunk, margin, margin + 235, 34, 58)}</svg>`)
    return sharp(svg).jpeg({ quality: 92 }).toBuffer()
  }))
}

export async function generateMapPdf(map: PublicMap, request: MapPdfRequest, options: { preview: boolean, publicBaseUrl: string, uploadDirectory: string, storage: PublicObjectStorage }) {
  const floors = request.floorMode === 'all' ? map.floors : map.floors.filter(floor => floor.id === request.floorId)
  if (!floors.length) throw createError({ statusCode: 400, statusMessage: '対象フロアが見つかりません。' })
  const document = await PDFDocument.create()
  for (const floor of floors) {
    const main = await renderFloorPage(map, floor, request, options)
    for (const jpeg of [main.jpeg, ...(await renderLegendPage(map, floor, main.overflow, request))]) {
      const page = document.addPage([main.size.widthPoints, main.size.heightPoints])
      const image = await document.embedJpg(jpeg)
      page.drawImage(image, { x: 0, y: 0, width: main.size.widthPoints, height: main.size.heightPoints })
    }
  }
  document.setTitle(`${map.name} 紙マップ`)
  document.setCreator('Digital Map')
  return Buffer.from(await document.save({ useObjectStreams: true }))
}
