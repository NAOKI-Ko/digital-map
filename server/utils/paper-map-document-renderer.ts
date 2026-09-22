import sharp from 'sharp'
import QRCode from 'qrcode'
import { PDFDocument } from 'pdf-lib'
import type { PaperMapConfig } from '~~/shared/schemas/paper-map'
import type { PaperMapSource } from '~~/shared/types/paper-map'
import { resolvePaperDocument, type PaperDocument, type PaperText } from '~~/shared/utils/paper-map-document'
import { viewportPoint } from '~~/shared/utils/paper-map-layout'
import { slotVisible } from '~~/shared/utils/paper-map-templates'
import { publicMapQrPayload, readMapAsset } from './map-pdf'
import type { PublicObjectStorage } from './public-storage'

const createError = (error: { statusCode: number, statusMessage: string }) => Object.assign(new Error(error.statusMessage), error)

export interface PaperRenderOptions { publicBaseUrl: string, uploadDirectory: string, storage: PublicObjectStorage }
const palettes = {
  brand: { accent: '#834b35', paper: '#fffdf8', ink: '#242c2a', muted: '#555f59', rule: '#d7d4c8' },
  simple: { accent: '#334155', paper: '#ffffff', ink: '#1e293b', muted: '#475569', rule: '#cbd5e1' },
  warm: { accent: '#9a3412', paper: '#fffcf4', ink: '#422006', muted: '#78513b', rule: '#ead6bd' },
  natural: { accent: '#3f6212', paper: '#fbfdf7', ink: '#1a2e05', muted: '#52653a', rule: '#dce5d1' },
}
const xml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!)
const text = (value: PaperText, x: number, y: number, fontSize: number, lineHeight: number, color: string, weight = 400) => value.lines.map((line, i) => `<text x="${x}" y="${y + i * lineHeight}" font-size="${fontSize}" font-weight="${weight}" fill="${color}">${xml(line)}</text>`).join('')
const image = (url: string, x: number, y: number, width: number, height: number, fit = 'xMidYMid meet') => `<image href="${xml(url)}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="${fit}"/>`

export function createPaperPageRenderer(source: PaperMapSource, config: PaperMapConfig, options: PaperRenderOptions, document: PaperDocument = resolvePaperDocument(source, config)) {
  const cache = new Map<string, Promise<string | null>>()
  const warnings = new Set(document.warnings)
  async function asset(url: string | null, required = false): Promise<string | null> {
    if (!url) return null
    if (!cache.has(url)) cache.set(url, (async () => {
      const bytes = await readMapAsset(url, options.uploadDirectory, options.storage)
      if (!bytes) return null
      // Decode only managed images. Normalize EXIF and encoding once per request.
      try { const png = await sharp(bytes).rotate().png().toBuffer(); return `data:image/png;base64,${png.toString('base64')}` }
      catch { return null }
    })())
    const result = await cache.get(url)!
    if (!result && required) throw createError({ statusCode: 422, statusMessage: '地図画像を読み込めません。元のマップ画像を確認してください。' })
    if (!result) warnings.add('読み込めない写真・ロゴ・装飾画像があります。元データの画像を確認してください。')
    return result
  }
  async function render(pageIndex: number, dpi = 150) {
    const page = document.pages[pageIndex]
    if (!page) throw createError({ statusCode: 422, statusMessage: '表示できる紙面がありません。掲載スポットを確認してください。' })
    const p = palettes[config.presentation.theme], m = document.margin
    const parts: string[] = []
    parts.push(`<rect width="100%" height="100%" fill="${p.paper}"/>`)
    parts.push(text(document.title, m, m + 23, 24, 29, p.ink, 700))
    let headerY = m + document.title.lines.length * 29 + 11
    parts.push(text(document.subtitle, m, headerY, 10, 14, p.muted)); headerY += document.subtitle.lines.length * 14
    if (document.intro.lines.length) parts.push(text(document.intro, m, headerY + 8, 10, 14, p.muted))
    if (slotVisible(config, 'logo') && source.map.logoUrl) {
      const logo = await asset(source.map.logoUrl)
      if (logo) parts.push(image(logo, document.width - m - 70, m, 70, 36, 'xMaxYMin meet'))
    }
    if (page.mapFrame && page.imageRect) {
      const frame = page.mapFrame, rect = page.imageRect, viewport = page.viewport
      const mapImage = await asset(page.floor.illustrationUrl, true)
      // Full source image is transformed through the same viewport as pins/decorations.
      // This avoids integer crop rounding and preserves existing geometry at all DPI.
      parts.push(`<defs><clipPath id="map-clip"><rect x="${frame.x}" y="${frame.y}" width="${frame.width}" height="${frame.height}"/></clipPath><clipPath id="image-clip"><rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}"/></clipPath></defs><g clip-path="url(#image-clip)">`)
      parts.push(image(mapImage!, rect.x - viewport.x / viewport.width * rect.width, rect.y - viewport.y / viewport.height * rect.height, rect.width / viewport.width, rect.height / viewport.height, 'none'))
      for (const decoration of page.floor.decorations) {
        const bytes = await asset(decoration.imageUrl)
        if (!bytes) continue
        const point = viewportPoint(decoration, viewport, rect)
        const w = decoration.width / viewport.width * rect.width, h = w * decoration.imageHeight / decoration.imageWidth
        parts.push(`<g transform="translate(${point.x} ${point.y}) rotate(${decoration.rotation})">${image(bytes, -w / 2, -h / 2, w, h)}</g>`)
      }
      parts.push('</g><g clip-path="url(#map-clip)">')
      for (const spot of page.floor.spots) {
        if (!document.numbers.has(spot.id) || !Number.isFinite(spot.x) || !Number.isFinite(spot.y)) continue
        if (spot.x < viewport.x || spot.x > viewport.x + viewport.width || spot.y < viewport.y || spot.y > viewport.y + viewport.height) continue
        const point = viewportPoint(spot, viewport, rect)
        const color = /^#[0-9a-f]{6}$/i.test(spot.pinColor) ? spot.pinColor : p.accent
        parts.push(`<circle cx="${point.x}" cy="${point.y}" r="8" fill="${color}" stroke="white" stroke-width="1.8"/><text x="${point.x}" y="${point.y + 3.1}" text-anchor="middle" font-size="8.5" font-weight="700" fill="white">${document.numbers.get(spot.id)}</text>`)
      }
      parts.push(`</g><rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" fill="none" stroke="${p.rule}" stroke-width=".6"/>`)
    }
    if (slotVisible(config, 'spotGuide')) {
      const frame = page.guideFrame
      const label = page.continuation ? 'スポット案内 / 続き' : 'スポット案内'
      parts.push(`<text x="${frame.x}" y="${frame.y + 10}" font-size="10" font-weight="700" fill="${p.accent}">${label}${source.map.floors.length > 1 ? ' · ' + xml(page.floor.name) : ''}</text>`)
      for (const card of page.cards) {
        const r = card.rect, x = r.x + 25
        parts.push(`<line x1="${r.x}" y1="${r.y + r.height + 3}" x2="${r.x + r.width}" y2="${r.y + r.height + 3}" stroke="${p.rule}" stroke-width=".5"/><circle cx="${r.x + 8}" cy="${r.y + 7}" r="8" fill="${p.accent}"/><text x="${r.x + 8}" y="${r.y + 10}" font-size="8.5" text-anchor="middle" font-weight="700" fill="white">${card.number}</text>`)
        let y = r.y + 11
        parts.push(text(card.name, x, y, 11, 14, p.ink, 700)); y += card.name.lines.length * 14
        parts.push(text(card.category, x, y, 9, 13, p.accent)); y += card.category.lines.length * 13
        parts.push(text(card.summary, x, y, 9.5, 12, p.muted))
        if (card.photo) { const photo = await asset(card.photo); if (photo) parts.push(image(photo, r.x + r.width - 74, r.y, 74, 62, 'xMidYMid slice')) }
      }
    }
    const footerTop = document.height - m - 48
    parts.push(`<line x1="${m}" y1="${footerTop - 10}" x2="${document.width - m}" y2="${footerTop - 10}" stroke="${p.rule}" stroke-width=".6"/>`)
    parts.push(text(document.footer, m, footerTop + 12, 9, 12, p.muted))
    parts.push(`<text x="${m}" y="${document.height - m}" font-size="9" fill="${p.muted}">${pageIndex + 1} / ${document.pages.length}</text>`)
    if (slotVisible(config, 'qr') && source.map.slug && source.publicUrlAvailable !== false) {
      const qr = await QRCode.toDataURL(publicMapQrPayload(options.publicBaseUrl, source.map.slug), { margin: 2, width: 300, errorCorrectionLevel: 'M' })
      parts.push(image(qr, document.width - m - 48, footerTop, 48, 48))
      parts.push(text(document.qrLabel, document.width - m - 208, footerTop + 18, 9, 12, p.muted))
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${document.width}" height="${document.height}" viewBox="0 0 ${document.width} ${document.height}"><style>text{font-family:'Noto Sans CJK JP','Hiragino Sans','Yu Gothic',sans-serif}</style>${parts.join('')}</svg>`
    return sharp(Buffer.from(svg), { density: dpi }).flatten({ background: p.paper }).png().toBuffer()
  }
  return { document, warnings, render }
}

export async function generatePaperDocumentPdf(source: PaperMapSource, config: PaperMapConfig, options: PaperRenderOptions) {
  const renderer = createPaperPageRenderer(source, config, options)
  if (!renderer.document.pages.length) throw createError({ statusCode: 422, statusMessage: 'PDFに出力できるスポットがありません。' })
  const pdf = await PDFDocument.create()
  for (let i = 0; i < renderer.document.pages.length; i++) {
    const png = await renderer.render(i, 300), embedded = await pdf.embedPng(png)
    const page = pdf.addPage([renderer.document.width, renderer.document.height])
    page.drawImage(embedded, { x: 0, y: 0, width: renderer.document.width, height: renderer.document.height })
  }
  pdf.setTitle(config.paperOriginal.title); pdf.setSubject(`Digital Map Paper Template ${config.templateId}@${config.templateVersion}`); pdf.setCreator('Digital Map')
  return Buffer.from(await pdf.save())
}
