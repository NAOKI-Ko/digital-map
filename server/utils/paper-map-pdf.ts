import { PDFDocument } from 'pdf-lib'
import QRCode from 'qrcode'
import sharp, { type OverlayOptions } from 'sharp'
import type { PaperMapConfig } from '~~/shared/schemas/paper-map'
import type { PublicFloor } from '~~/shared/types/public-map'
import type { PaperMapSource } from '~~/shared/types/paper-map'
import { containRect, paperPageSize, resolvePaperLayout, resolveViewport, viewportPoint } from '~~/shared/utils/paper-map-layout'
import { selectPaperMapSpots } from './paper-map'
import { publicMapQrPayload, readMapAsset } from './map-pdf'
import type { PublicObjectStorage } from './public-storage'

const themes = {
  brand: { accent: '#b4532a', background: '#fffaf5', ink: '#292524', soft: '#f5e7dc' },
  simple: { accent: '#334155', background: '#ffffff', ink: '#0f172a', soft: '#e2e8f0' },
  warm: { accent: '#c2410c', background: '#fffbeb', ink: '#422006', soft: '#fed7aa' },
  natural: { accent: '#3f6212', background: '#f7fee7', ink: '#1a2e05', soft: '#d9f99d' },
} as const

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]!)
}

function displayLines(config: PaperMapConfig, spots: ReturnType<typeof selectPaperMapSpots>) {
  return spots.map((spot, index) => {
    if (config.density === 'names') return `${index + 1}. ${spot.name}`
    const category = spot.categories[0]?.name
    if (config.density === 'standard') return `${index + 1}. ${spot.name}${category ? ` — ${category}` : ''}`
    const detail = spot.description || spot.informationFields[0]?.value || category || ''
    return `${index + 1}. ${spot.name}${detail ? ` — ${detail.slice(0, 42)}` : ''}`
  })
}

async function renderFloor(source: PaperMapSource, floor: PublicFloor, config: PaperMapConfig, options: { publicBaseUrl: string, uploadDirectory: string, storage: PublicObjectStorage }) {
  const size = paperPageSize(config.paper, config.orientation)
  const layout = resolvePaperLayout(config, size.widthPx, size.heightPx)
  const palette = themes[config.theme]
  const selectedIds = new Set(selectPaperMapSpots(source, config).map(spot => spot.id))
  const selectedSpots = floor.spots.filter(spot => selectedIds.has(spot.id))
  const viewport = resolveViewport(config, selectedSpots.map(spot => ({ x: spot.x, y: spot.y })))
  const spots = selectedSpots.filter(spot => spot.x >= viewport.x && spot.x <= viewport.x + viewport.width && spot.y >= viewport.y && spot.y <= viewport.y + viewport.height)
  const target = layout.mapFrame
  const sourceWidth = floor.imageWidth * viewport.width
  const sourceHeight = floor.imageHeight * viewport.height
  const imageRect = containRect(sourceWidth, sourceHeight, target)
  const canvas = sharp({ create: { width: size.widthPx, height: size.heightPx, channels: 3, background: palette.background } })
  const composites: OverlayOptions[] = []
  const background = await readMapAsset(floor.illustrationUrl, options.uploadDirectory, options.storage)
  if (background) {
    const extract = { left: Math.round(floor.imageWidth * viewport.x), top: Math.round(floor.imageHeight * viewport.y), width: Math.max(1, Math.round(sourceWidth)), height: Math.max(1, Math.round(sourceHeight)) }
    const prepared = await sharp(background).extract(extract).resize(Math.round(target.width), Math.round(target.height), { fit: 'contain', background: palette.soft }).jpeg({ quality: 92 }).toBuffer()
    composites.push({ input: prepared, left: Math.round(target.x), top: Math.round(target.y) })
  }
  else {
    composites.push({ input: Buffer.from(`<svg width="${target.width}" height="${target.height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${palette.soft}"/><text x="50%" y="50%" text-anchor="middle" font-size="42" fill="#78716c">マップ画像を読み込めません</text></svg>`), left: Math.round(target.x), top: Math.round(target.y) })
  }
  for (const decoration of floor.decorations.filter(item => item.x >= viewport.x && item.x <= viewport.x + viewport.width && item.y >= viewport.y && item.y <= viewport.y + viewport.height)) {
    const bytes = await readMapAsset(decoration.imageUrl, options.uploadDirectory, options.storage)
    if (!bytes) continue
    const point = viewportPoint(decoration, viewport, imageRect)
    const width = Math.max(1, Math.round(decoration.width / viewport.width * imageRect.width))
    const prepared = await sharp(bytes).resize({ width, withoutEnlargement: true }).rotate(decoration.rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
    const metadata = await sharp(prepared).metadata()
    composites.push({ input: prepared, left: Math.round(point.x - (metadata.width ?? width) / 2), top: Math.round(point.y - (metadata.height ?? width) / 2) })
  }
  const spotIndex = new Map(selectPaperMapSpots(source, config).map((spot, index) => [spot.id, index + 1]))
  const markers = spots.map((spot) => {
    const point = viewportPoint(spot, viewport, imageRect)
    const number = spotIndex.get(spot.id)
    return `<g><circle cx="${point.x}" cy="${point.y}" r="22" fill="${escapeXml(spot.pinColor || palette.accent)}" stroke="#fff" stroke-width="5"/><text x="${point.x}" y="${point.y + 8}" text-anchor="middle" font-size="23" font-weight="700" fill="#fff">${number}</text></g>`
  }).join('')
  const allSelected = selectPaperMapSpots(source, config)
  const lines = displayLines(config, allSelected)
  const lineHeight = config.density === 'detail' ? 42 : 38
  const photoSpots = config.photos === 'none' ? [] : allSelected.filter(spot => spot.photos.length).slice(0, config.photos === 'featured' ? 2 : 4)
  const photoArea = photoSpots.length ? Math.min(250, layout.infoFrame.height * 0.28) : 0
  const maxLines = Math.max(1, Math.floor((layout.infoFrame.height - 75 - photoArea) / lineHeight))
  const legend = lines.slice(0, maxLines).map((line, index) => `<text x="${layout.infoFrame.x}" y="${layout.infoFrame.y + 62 + index * lineHeight}" font-size="${config.density === 'names' ? 25 : 22}" fill="${palette.ink}">${escapeXml(line)}</text>`).join('')
  const headerSize = Math.round(size.widthPx * 0.018)
  const qrLabel = config.qrEnabled ? `<text x="${size.widthPx - layout.margin - Math.round(Math.min(size.widthPx, size.heightPx) * 0.115) - 18}" y="${size.heightPx - layout.margin - 16}" text-anchor="end" font-size="20" fill="#57534e">${escapeXml(config.qrLabel)}</text>` : ''
  const overlay = Buffer.from(`<svg width="${size.widthPx}" height="${size.heightPx}" xmlns="http://www.w3.org/2000/svg"><style>text{font-family:-apple-system,BlinkMacSystemFont,'Noto Sans CJK JP','Hiragino Sans','Yu Gothic',sans-serif}</style><text x="${layout.margin}" y="${layout.margin + headerSize}" font-size="${headerSize}" font-weight="700" fill="${palette.ink}">${escapeXml(config.title)}</text><text x="${layout.margin}" y="${layout.margin + headerSize + 44}" font-size="28" fill="#57534e">${escapeXml(config.subtitle || floor.name)}</text><rect x="${target.x}" y="${target.y}" width="${target.width}" height="${target.height}" fill="none" stroke="${palette.accent}" stroke-width="4"/>${markers}<text x="${layout.infoFrame.x}" y="${layout.infoFrame.y + 24}" font-size="28" font-weight="700" fill="${palette.accent}">スポット案内</text>${legend}${qrLabel}<text x="${layout.margin}" y="${size.heightPx - layout.margin / 2}" font-size="20" fill="#78716c">${escapeXml(source.mode === 'LIVE' ? '現在の編集内容から作成' : '公開版から作成')}</text></svg>`)
  composites.push({ input: overlay, left: 0, top: 0 })
  if (photoSpots.length) {
    const gap = 16
    const thumbWidth = Math.max(80, Math.floor((layout.infoFrame.width - gap * Math.min(3, photoSpots.length - 1)) / Math.min(3, photoSpots.length)))
    const thumbHeight = Math.round(Math.min(photoArea, thumbWidth * 0.68))
    for (const [index, spot] of photoSpots.entries()) {
      const bytes = await readMapAsset(spot.photos[0] ?? null, options.uploadDirectory, options.storage)
      if (!bytes) continue
      const prepared = await sharp(bytes).resize(thumbWidth, thumbHeight, { fit: 'cover' }).jpeg({ quality: 88 }).toBuffer()
      composites.push({ input: prepared, left: Math.round(layout.infoFrame.x + (index % 3) * (thumbWidth + gap)), top: Math.round(layout.infoFrame.y + layout.infoFrame.height - photoArea + Math.floor(index / 3) * (thumbHeight + gap)) })
    }
  }
  if (config.logoEnabled) {
    const logo = await readMapAsset(source.map.logoUrl, options.uploadDirectory, options.storage)
    if (logo) {
      const prepared = await sharp(logo).resize({ width: Math.round(size.widthPx * 0.14), height: Math.round(layout.header * 0.55), fit: 'inside', withoutEnlargement: true }).png().toBuffer()
      const metadata = await sharp(prepared).metadata()
      composites.push({ input: prepared, left: Math.round(size.widthPx - layout.margin - (metadata.width ?? 1)), top: Math.round(layout.margin * 0.75) })
    }
  }
  if (config.qrEnabled) {
    const qrSize = Math.round(Math.min(size.widthPx, size.heightPx) * 0.115)
    const qr = await QRCode.toBuffer(publicMapQrPayload(options.publicBaseUrl, source.map.slug), { errorCorrectionLevel: 'M', margin: 1, width: qrSize })
    composites.push({ input: qr, left: Math.round(size.widthPx - layout.margin - qrSize), top: Math.round(size.heightPx - layout.margin - qrSize) })
  }
  return { jpeg: await canvas.composite(composites).jpeg({ quality: 92 }).toBuffer(), size, overflow: lines.slice(maxLines) }
}

async function renderLegendPages(title: string, floorName: string, lines: string[], config: PaperMapConfig) {
  if (!lines.length) return []
  const size = paperPageSize(config.paper, config.orientation)
  const palette = themes[config.theme]
  const margin = Math.round(size.widthPx * 0.06)
  const lineHeight = config.density === 'detail' ? 52 : 46
  const perPage = Math.max(1, Math.floor((size.heightPx - margin * 2 - 160) / lineHeight))
  const chunks = Array.from({ length: Math.ceil(lines.length / perPage) }, (_, index) => lines.slice(index * perPage, (index + 1) * perPage))
  return Promise.all(chunks.map(async (chunk, index) => {
    const body = chunk.map((line, lineIndex) => `<text x="${margin}" y="${margin + 170 + lineIndex * lineHeight}" font-size="28" fill="${palette.ink}">${escapeXml(line)}</text>`).join('')
    const svg = Buffer.from(`<svg width="${size.widthPx}" height="${size.heightPx}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${palette.background}"/><style>text{font-family:-apple-system,BlinkMacSystemFont,'Noto Sans CJK JP','Hiragino Sans','Yu Gothic',sans-serif}</style><text x="${margin}" y="${margin + 60}" font-size="50" font-weight="700" fill="${palette.ink}">${escapeXml(title)}</text><text x="${margin}" y="${margin + 115}" font-size="30" fill="${palette.accent}">${escapeXml(floorName)} · スポット案内 ${index + 2}</text>${body}</svg>`)
    return sharp(svg).jpeg({ quality: 92 }).toBuffer()
  }))
}

export async function generatePaperMapPdf(source: PaperMapSource, config: PaperMapConfig, options: { publicBaseUrl: string, uploadDirectory: string, storage: PublicObjectStorage }) {
  const selected = new Set(selectPaperMapSpots(source, config).map(spot => spot.id))
  const floors = source.map.floors.filter(floor => floor.spots.some(spot => selected.has(spot.id)))
  if (!floors.length) throw createError({ statusCode: 422, statusMessage: 'PDFに出力できるスポットがありません。' })
  const document = await PDFDocument.create()
  for (const floor of floors) {
    const rendered = await renderFloor(source, floor, config, options)
    const pages = [rendered.jpeg, ...(await renderLegendPages(config.title, floor.name, rendered.overflow, config))]
    for (const jpeg of pages) {
      const page = document.addPage([rendered.size.widthPoints, rendered.size.heightPoints])
      const image = await document.embedJpg(jpeg)
      page.drawImage(image, { x: 0, y: 0, width: rendered.size.widthPoints, height: rendered.size.heightPoints })
    }
  }
  document.setTitle(config.title)
  document.setSubject('Digital Map 紙マップ Easy Builder')
  document.setCreator('Digital Map')
  return Buffer.from(await document.save({ useObjectStreams: true }))
}
