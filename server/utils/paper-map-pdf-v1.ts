import { PDFDocument } from 'pdf-lib'
import QRCode from 'qrcode'
import sharp, { type OverlayOptions } from 'sharp'
import type { PaperMapConfig } from '~~/shared/schemas/paper-map'
import type { PaperMapSource } from '~~/shared/types/paper-map'
import { resolvePaperRenderModel, selectPaperMapSpotsFromSource } from '~~/shared/utils/paper-map-render'
import { paperPageSize, viewportPoint } from '~~/shared/utils/paper-map-layout'
import { publicMapQrPayload, readMapAsset } from './map-pdf'
import type { PublicObjectStorage } from './public-storage'

const themes = {
  brand: { accent: '#9a4829', background: '#fffdf9', ink: '#292524', soft: '#f1e7db', muted: '#78716c' },
  simple: { accent: '#334155', background: '#ffffff', ink: '#0f172a', soft: '#e2e8f0', muted: '#64748b' },
  warm: { accent: '#c2410c', background: '#fffbeb', ink: '#422006', soft: '#fed7aa', muted: '#92400e' },
  natural: { accent: '#3f6212', background: '#fbfdf7', ink: '#1a2e05', soft: '#e5efcf', muted: '#52653a' },
} as const

function escapeXml(value: string) { return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]!) }
function truncate(value: string, length: number) { return value.length > length ? `${value.slice(0, length - 1)}…` : value }

async function renderPage(source: PaperMapSource, config: PaperMapConfig, options: { publicBaseUrl: string, uploadDirectory: string, storage: PublicObjectStorage }) {
  const model = resolvePaperRenderModel(source, config)
  const palette = themes[config.presentation.theme]
  const { size, mapFrame, imageRect } = model
  const canvas = sharp({ create: { width: size.widthPx, height: size.heightPx, channels: 3, background: palette.background } })
  const composites: OverlayOptions[] = []
  if (model.floor) {
    const background = await readMapAsset(model.floor.illustrationUrl, options.uploadDirectory, options.storage)
    if (background) {
      const sourceWidth = model.floor.imageWidth * model.viewport.width, sourceHeight = model.floor.imageHeight * model.viewport.height
      const prepared = await sharp(background).extract({ left: Math.round(model.floor.imageWidth * model.viewport.x), top: Math.round(model.floor.imageHeight * model.viewport.y), width: Math.max(1, Math.round(sourceWidth)), height: Math.max(1, Math.round(sourceHeight)) }).resize(Math.round(mapFrame.width), Math.round(mapFrame.height), { fit: 'contain', background: palette.soft }).jpeg({ quality: 94 }).toBuffer()
      composites.push({ input: prepared, left: Math.round(mapFrame.x), top: Math.round(mapFrame.y) })
    }
  }
  if (!composites.length) composites.push({ input: Buffer.from(`<svg width="${mapFrame.width}" height="${mapFrame.height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${palette.soft}"/><text x="50%" y="50%" text-anchor="middle" font-size="38" fill="${palette.muted}">マップ画像を読み込めません</text></svg>`), left: Math.round(mapFrame.x), top: Math.round(mapFrame.y) })
  if (model.floor) for (const decoration of model.floor.decorations) {
    const bytes = await readMapAsset(decoration.imageUrl, options.uploadDirectory, options.storage)
    if (!bytes) continue
    const point = viewportPoint(decoration, model.viewport, imageRect)
    const width = Math.max(1, Math.round(decoration.width / model.viewport.width * imageRect.width))
    const prepared = await sharp(bytes).resize({ width, withoutEnlargement: true }).rotate(decoration.rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
    const metadata = await sharp(prepared).metadata()
    composites.push({ input: prepared, left: Math.round(point.x - (metadata.width ?? width) / 2), top: Math.round(point.y - (metadata.height ?? width) / 2) })
  }
  const markerSvg = model.spots.filter(spot => spot.point).map(spot => `<g><circle cx="${spot.point!.x}" cy="${spot.point!.y}" r="22" fill="${escapeXml(spot.pinColor || palette.accent)}" stroke="#fff" stroke-width="5"/><text x="${spot.point!.x}" y="${spot.point!.y + 8}" text-anchor="middle" font-size="23" font-weight="700" fill="#fff">${spot.number}</text></g>`).join('')
  const photoArea = model.visible('photoFeature') && model.photos.length ? Math.min(430, model.infoFrame.height * 0.42) : 0
  const lineHeight = config.presentation.informationDensity === 'detail' ? 70 : 48
  const maxLines = Math.max(1, Math.floor((model.infoFrame.height - 90 - photoArea) / lineHeight))
  const visibleSpots = model.spots.slice(0, maxLines)
  const guide = model.visible('spotGuide') ? visibleSpots.map((spot, index) => {
    const y = model.infoFrame.y + 58 + index * lineHeight
    const category = spot.categories[0]?.name ?? ''
    const detail = config.presentation.informationDensity === 'detail' ? truncate(spot.summary, 34) : config.presentation.informationDensity === 'standard' ? category : ''
    return `<circle cx="${model.infoFrame.x + 15}" cy="${y - 8}" r="15" fill="${palette.accent}"/><text x="${model.infoFrame.x + 15}" y="${y - 2}" text-anchor="middle" font-size="16" font-weight="700" fill="#fff">${spot.number}</text><text x="${model.infoFrame.x + 42}" y="${y}" font-size="23" font-weight="700" fill="${palette.ink}">${escapeXml(truncate(spot.name, 22))}</text>${detail ? `<text x="${model.infoFrame.x + 42}" y="${y + 29}" font-size="18" fill="${palette.muted}">${escapeXml(detail)}</text>` : ''}`
  }).join('') : ''
  const categories = model.visible('categoryLegend') && model.categories.length ? `<text x="${model.infoFrame.x}" y="${model.infoFrame.y + model.infoFrame.height - photoArea - 18}" font-size="17" fill="${palette.muted}">${escapeXml(model.categories.join('  ·  '))}</text>` : ''
  const headerSize = Math.round(size.widthPx * 0.021)
  const intro = model.visible('intro') && model.intro ? `<text x="${mapFrame.x}" y="${mapFrame.y - 24}" font-size="20" fill="${palette.muted}">${escapeXml(truncate(model.intro, 80))}</text>` : ''
  const footer = model.visible('footer') ? escapeXml(model.footer || (source.mode === 'LIVE' ? '現在の編集内容から作成' : '公開版から作成')) : ''
  const qrLabel = model.visible('qr') ? `<text x="${size.widthPx - size.widthPx * .165}" y="${size.heightPx - size.heightPx * .055}" text-anchor="end" font-size="18" fill="${palette.muted}">${escapeXml(model.qrLabel)}</text>` : ''
  const overlay = Buffer.from(`<svg width="${size.widthPx}" height="${size.heightPx}" xmlns="http://www.w3.org/2000/svg"><style>text{font-family:-apple-system,BlinkMacSystemFont,'Noto Sans CJK JP','Hiragino Sans','Yu Gothic',sans-serif}</style><text x="${mapFrame.x}" y="${size.heightPx * 0.068}" font-size="${headerSize}" font-weight="700" letter-spacing="1" fill="${palette.ink}">${escapeXml(model.title)}</text><text x="${mapFrame.x}" y="${size.heightPx * 0.096}" font-size="24" fill="${palette.muted}">${escapeXml(model.subtitle)}</text>${intro}<rect x="${mapFrame.x}" y="${mapFrame.y}" width="${mapFrame.width}" height="${mapFrame.height}" fill="none" stroke="${palette.accent}" stroke-width="4"/>${markerSvg}<text x="${model.infoFrame.x}" y="${model.infoFrame.y + 20}" font-size="27" font-weight="700" fill="${palette.accent}">スポット案内</text>${guide}${categories}${qrLabel}<text x="${mapFrame.x}" y="${size.heightPx - size.heightPx * 0.035}" font-size="18" fill="${palette.muted}">${footer}</text></svg>`)
  composites.push({ input: overlay, left: 0, top: 0 })
  if (photoArea) {
    const columns = config.orientation === 'landscape' ? 2 : 4, gap = 14
    const width = Math.floor((model.infoFrame.width - gap * (columns - 1)) / columns), height = Math.round(Math.min(photoArea, width * 0.7))
    for (const [index, spot] of model.photos.slice(0, columns).entries()) {
      const bytes = await readMapAsset(spot.photos[0] ?? null, options.uploadDirectory, options.storage)
      if (!bytes) continue
      const prepared = await sharp(bytes).resize(width, height, { fit: 'cover' }).jpeg({ quality: 90 }).toBuffer()
      composites.push({ input: prepared, left: Math.round(model.infoFrame.x + index * (width + gap)), top: Math.round(model.infoFrame.y + model.infoFrame.height - photoArea + 15) })
    }
  }
  if (model.visible('logo') && source.map.logoUrl) {
    const logo = await readMapAsset(source.map.logoUrl, options.uploadDirectory, options.storage)
    if (logo) composites.push({ input: await sharp(logo).resize({ width: Math.round(size.widthPx * 0.13), height: Math.round(size.heightPx * 0.07), fit: 'inside', withoutEnlargement: true }).png().toBuffer(), left: Math.round(size.widthPx * 0.81), top: Math.round(size.heightPx * 0.035) })
  }
  if (model.visible('qr') && source.map.slug) {
    const qrSize = Math.round(Math.min(size.widthPx, size.heightPx) * 0.1)
    const qr = await QRCode.toBuffer(publicMapQrPayload(options.publicBaseUrl, source.map.slug), { errorCorrectionLevel: 'M', margin: 1, width: qrSize })
    composites.push({ input: qr, left: Math.round(size.widthPx - size.widthPx * 0.048 - qrSize), top: Math.round(size.heightPx - size.heightPx * 0.048 - qrSize) })
  }
  return { jpeg: await canvas.composite(composites).jpeg({ quality: 94 }).toBuffer(), model, overflow: model.spots.slice(maxLines) }
}

async function renderOverflowPage(config: PaperMapConfig, title: string, spots: ReturnType<typeof resolvePaperRenderModel>['spots']) {
  const pageSize = paperPageSize(config.paper, config.orientation)
  const palette = themes[config.presentation.theme], margin = Math.round(pageSize.widthPx * 0.06), lineHeight = 58
  const body = spots.slice(0, Math.floor((pageSize.heightPx - margin * 2 - 150) / lineHeight)).map((spot, index) => `<text x="${margin}" y="${margin + 145 + index * lineHeight}" font-size="26" fill="${palette.ink}">${spot.number}. ${escapeXml(truncate(spot.name, 26))}　<tspan font-size="20" fill="${palette.muted}">${escapeXml(truncate(spot.summary, 48))}</tspan></text>`).join('')
  return sharp(Buffer.from(`<svg width="${pageSize.widthPx}" height="${pageSize.heightPx}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${palette.background}"/><style>text{font-family:-apple-system,BlinkMacSystemFont,'Noto Sans CJK JP','Hiragino Sans','Yu Gothic',sans-serif}</style><text x="${margin}" y="${margin + 55}" font-size="46" font-weight="700" fill="${palette.ink}">${escapeXml(title)}</text><text x="${margin}" y="${margin + 100}" font-size="25" fill="${palette.accent}">スポット案内（続き）</text>${body}</svg>`)).jpeg({ quality: 94 }).toBuffer()
}

export async function generateLegacyPaperMapPdf(source: PaperMapSource, config: PaperMapConfig, options: { publicBaseUrl: string, uploadDirectory: string, storage: PublicObjectStorage }) {
  const selectedIds = new Set(selectPaperMapSpotsFromSource(source, config).map(spot => spot.id))
  const floors = source.map.floors.filter(floor => floor.spots.some(spot => selectedIds.has(spot.id)))
  if (!floors.length) throw createError({ statusCode: 422, statusMessage: 'PDFに出力できるスポットがありません。' })
  const document = await PDFDocument.create()
  for (const floor of floors) {
    const floorSource = { ...source, map: { ...source.map, floors: [floor] }, spotCount: floor.spots.length, photoCount: floor.spots.filter(spot => spot.photos.length).length }
    const rendered = await renderPage(floorSource, config, options), images = [rendered.jpeg]
    if (rendered.overflow.length) images.push(await renderOverflowPage(config, rendered.model.title, rendered.overflow))
    for (const jpeg of images) { const page = document.addPage([rendered.model.size.widthPoints, rendered.model.size.heightPoints]); const image = await document.embedJpg(jpeg); page.drawImage(image, { x: 0, y: 0, width: rendered.model.size.widthPoints, height: rendered.model.size.heightPoints }) }
  }
  document.setTitle(config.paperOriginal.title); document.setSubject(`Digital Map Paper Template ${config.templateId}@${config.templateVersion}`); document.setCreator('Digital Map')
  return Buffer.from(await document.save({ useObjectStreams: true }))
}
