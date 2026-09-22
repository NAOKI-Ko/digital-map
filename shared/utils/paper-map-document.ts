import type { PaperMapConfig } from '../schemas/paper-map'
import type { PaperMapSource } from '../types/paper-map'
import type { PublicFloor, PublicSpot } from '../types/public-map'
import { containRect, paperPageSize, resolveViewport, type PaperRect } from './paper-map-layout'
import { selectPaperMapSpotsFromSource } from './paper-map-render'
import { slotVisible } from './paper-map-templates'

export interface PaperText { lines: string[], clipped: boolean }
export interface PaperCard { spot: PublicSpot, number: number, rect: PaperRect, name: PaperText, summary: PaperText, category: PaperText, photo: string | null }
export interface PaperDocumentPage { floor: PublicFloor, mapFrame?: PaperRect, imageRect?: PaperRect, viewport: ReturnType<typeof resolveViewport>, cards: PaperCard[], guideFrame: PaperRect, continuation: boolean }
export interface PaperDocument { width: number, height: number, margin: number, title: PaperText, subtitle: PaperText, intro: PaperText, footer: PaperText, qrLabel: PaperText, pages: PaperDocumentPage[], numbers: Map<string, number>, selectedCount: number, clippedCount: number, warnings: string[] }

// Conservative character advances, shared by pagination and rendering. No generated prose.
export function paperText(value: string, width: number, fontSize: number, maxLines: number): PaperText {
  const lines: string[] = []
  let line = '', advance = 0
  for (const character of Array.from(value.replace(/\r/g, ''))) {
    const next = /[\u0020-\u007e]/.test(character) ? fontSize * .6 : fontSize
    if (character === '\n' || (line && advance + next > width)) {
      lines.push(line); line = ''; advance = 0
      if (character === '\n') continue
    }
    line += character; advance += next
  }
  if (line) lines.push(line)
  const clipped = lines.length > maxLines
  const shown = lines.slice(0, maxLines)
  if (clipped && shown.length) shown[shown.length - 1] = Array.from(shown[shown.length - 1]!).slice(0, -1).join('') + '…'
  return { lines: shown, clipped }
}

export function resolvePaperDocument(source: PaperMapSource, config: PaperMapConfig): PaperDocument {
  const size = paperPageSize(config.paper, config.orientation)
  const width = size.widthPoints, height = size.heightPoints, margin = config.paper === 'A3' ? 34 : 26
  const contentWidth = width - margin * 2
  const title = paperText(config.paperOriginal.title, contentWidth - (slotVisible(config, 'logo') && source.map.logoUrl ? 84 : 0), 24, 2)
  const subtitle = paperText(config.paperOriginal.subtitle || source.map.organizationName || '', contentWidth - (slotVisible(config, 'logo') && source.map.logoUrl ? 84 : 0), 10, 2)
  const intro = paperText(slotVisible(config, 'intro') ? config.paperOriginal.intro : '', contentWidth, 10, 3)
  const footer = paperText(slotVisible(config, 'footer') ? config.paperOriginal.footer : '', contentWidth - 200, 9, 2)
  const qrLabel = paperText(config.paperOriginal.qrLabel, 150, 9, 3)
  const top = margin + title.lines.length * 29 + subtitle.lines.length * 14 + (intro.lines.length ? intro.lines.length * 14 + 8 : 0) + 18
  const content: PaperRect = { x: margin, y: top, width: contentWidth, height: height - top - margin - 62 }
  const selected = selectPaperMapSpotsFromSource(source, config)
  const numbers = new Map(selected.map((spot, index) => [spot.id, index + 1]))
  const photoIds = new Set(selected.filter(spot => spot.photos.length).slice(0, config.presentation.photoMode === 'featured' ? 4 : undefined).map(spot => spot.id))
  const overrides = new Map(config.spotOverrides.map(item => [item.spotId, item.summary]))
  const pages: PaperDocumentPage[] = []
  let clippedCount = [title, subtitle, intro, footer, qrLabel].filter(text => text.clipped).length
  const warnings: string[] = []
  for (const floor of source.map.floors) {
    const spots = selected.filter(spot => spot.floorId === floor.id)
    if (!spots.length) continue
    const viewport = resolveViewport(config, spots.filter(spot => Number.isFinite(spot.x) && Number.isFinite(spot.y)))
    const guide = slotVisible(config, 'spotGuide')
    let mapFrame: PaperRect, guideFrame: PaperRect
    if (!guide) { mapFrame = { ...content }; guideFrame = { ...content, height: 0 } }
    else if (config.orientation === 'landscape') {
      const ratio = config.templateId === 'map-classic' ? .67 : .53
      mapFrame = { ...content, width: content.width * ratio }
      guideFrame = { x: mapFrame.x + mapFrame.width + 20, y: content.y, width: content.width - mapFrame.width - 20, height: content.height }
    }
    else {
      const limit = config.templateId === 'map-classic' ? .59 : config.templateId === 'photo-story' ? .30 : .32
      const aspectHeight = content.width * floor.imageHeight * viewport.height / (floor.imageWidth * viewport.width)
      mapFrame = { ...content, height: Math.min(content.height * limit, aspectHeight) }
      guideFrame = { ...content, y: mapFrame.y + mapFrame.height + 22, height: content.height - mapFrame.height - 22 }
    }
    const imageRect = containRect(floor.imageWidth * viewport.width, floor.imageHeight * viewport.height, mapFrame)
    let page: PaperDocumentPage = { floor, mapFrame, imageRect, viewport, cards: [], guideFrame, continuation: false }
    pages.push(page)
    if (!guide) continue
    let index = 0
    while (index < spots.length) {
      const frame = page.guideFrame
      const columns = frame.width >= 380 ? 2 : 1
      const gap = 18, cardWidth = (frame.width - gap * (columns - 1)) / columns
      let y = frame.y + 24
      while (index < spots.length) {
        const row = spots.slice(index, index + columns).map(spot => {
          const photo = config.templateId === 'photo-story' && slotVisible(config, 'photoFeature') && config.presentation.photoMode !== 'none' && photoIds.has(spot.id) ? spot.photos[0] ?? null : null
          const textWidth = cardWidth - 25 - (photo ? 82 : 0)
          const name = paperText(spot.name, textWidth, 11, 3)
          const summary = paperText(config.presentation.informationDensity === 'detail' ? overrides.get(spot.id) || spot.description || '' : '', textWidth, 9.5, 3)
          const category = paperText(slotVisible(config, 'categoryLegend') && config.presentation.informationDensity !== 'names' ? spot.categories.map(item => item.name).join(' / ') : '', textWidth, 9, 1)
          const textHeight = name.lines.length * 14 + category.lines.length * 13 + summary.lines.length * 12 + 12
          return { spot, number: numbers.get(spot.id)!, name, summary, category, photo, height: Math.max(photo ? 72 : 27, textHeight) }
        })
        const rowHeight = Math.max(...row.map(card => card.height))
        if (y + rowHeight > frame.y + frame.height) break
        for (const [column, card] of row.entries()) {
          page.cards.push({ ...card, rect: { x: frame.x + column * (cardWidth + gap), y, width: cardWidth, height: rowHeight } })
          clippedCount += [card.name, card.summary, card.category].filter(text => text.clipped).length
        }
        index += row.length; y += rowHeight + (config.presentation.informationDensity === 'names' ? 4 : 9)
      }
      if (index >= spots.length) break
      page = { floor, viewport, cards: [], guideFrame: { ...content }, continuation: true }
      pages.push(page)
      // Minimum full-page capacity is guaranteed by bounded paper/header geometry.
      if (pages.length > 64) throw new Error('紙面が64ページを超えます。掲載するスポットを絞ってください。')
    }
  }
  if (!selected.length) warnings.push('公開・配置済みのスポットがありません。スポットの公開設定と位置を確認してください。')
  if (clippedCount) warnings.push(`${clippedCount}か所の長い文章を紙面上で省略しています。必要に応じて紙専用の文章を調整してください。`)
  if (config.templateId === 'photo-story' && !selected.some(spot => spot.photos.length)) warnings.push('写真がないため、文字の案内として組版しています。')
  if (slotVisible(config, 'qr') && source.publicUrlAvailable === false) warnings.push('Webマップが公開されていないため、QRは掲載しません。')
  if (pages.length > 1) warnings.push(`全${pages.length}ページです。すべてのページを確認して印刷してください。`)
  return { width, height, margin, title, subtitle, intro, footer, qrLabel, pages, numbers, selectedCount: selected.length, clippedCount, warnings }
}
