import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import type { PaperMapSource } from '../shared/types/paper-map'
import { defaultPaperMapConfig, switchPaperTemplate } from '../shared/utils/paper-map-templates'
import { paperText, resolvePaperDocument } from '../shared/utils/paper-map-document'
import { viewportPoint } from '../shared/utils/paper-map-layout'
import { createPaperPageRenderer, generatePaperDocumentPdf } from '../server/utils/paper-map-document-renderer'
import { paperMapPreviewToken } from '../server/utils/paper-map-preview-token'
import { ARIMATSU_SPOTS } from '../scripts/qa/arimatsu-baseline-lib'

// Geometry-only synthetic coordinates. These fixtures are never delivered as factual maps.
function source(count = 12, floors = 1): PaperMapSource {
  return { mode: 'LIVE', publicUrlAvailable: false, spotCount: count, categoryCount: 1, photoCount: 0, map: {
    id: 'map', name: '有松マップ', slug: 'arimatsu', organizationName: null, logoUrl: null, websiteUrl: null, snsUrl: null, locale: 'ja', defaultLocale: 'ja', enabledLocales: ['ja'], seo: { title: '', description: '', imageUrl: null },
    floors: Array.from({ length: floors }, (_, floor) => ({ id: `floor-${floor}`, name: `Floor ${floor}`, order: floor, illustrationUrl: '/uploads/arimatsu-map.png', imageWidth: 1448, imageHeight: 1086, refAImageX: null, refAImageY: null, refALat: null, refALng: null, refBImageX: null, refBImageY: null, refBLat: null, refBLng: null, decorations: [], spots: Array.from({length: count}, (_, i) => i).filter(i => i % floors === floor).map(i => ({ id: `spot-${i}`, floorId: `floor-${floor}`, name: ARIMATSU_SPOTS[i % 16]!.name, description: ARIMATSU_SPOTS[i % 16]!.description, categories: [], importance: 'normal' as const, x: (i % 5) / 4, y: .5, photos: [], informationFields: [], websiteAction: null, pinIconType: 'PRESET' as const, pinIconId: 'place', pinIconImageUrl: null, pinColor: '#834b35', pinSize: 'MEDIUM' as const })) }))
  } }
}
const options = { publicBaseUrl: 'http://localhost:3018', uploadDirectory: resolve('prisma/seed-assets/arimatsu-demo'), storage: { put: async () => undefined, get: async () => null } }

describe('Paper template 2 document contract', () => {
  it('versions new defaults explicitly and leaves existing configs unchanged', () => {
    const old = defaultPaperMapConfig('spot-guide', 12, '有松', 1), before = JSON.stringify(old)
    expect(defaultPaperMapConfig('spot-guide', 12, '有松').templateVersion).toBe(2)
    expect(old.templateVersion).toBe(1)
    expect(switchPaperTemplate(old, 'spot-guide').templateVersion).toBe(2)
    expect(JSON.stringify(old)).toBe(before)
  })
  it('does not discard any of 500 spots across unlimited continuation pages', () => {
    const input = source(500, 3), original = JSON.stringify(input)
    const doc = resolvePaperDocument(input, defaultPaperMapConfig('spot-guide', 500, input.map.name))
    const ids = doc.pages.flatMap(page => page.cards.map(card => card.spot.id))
    expect(ids).toHaveLength(500); expect(new Set(ids).size).toBe(500)
    expect(doc.pages.filter(page => page.mapFrame)).toHaveLength(3)
    expect(new Set(doc.pages.flatMap(page => page.cards.map(card => card.number))).size).toBe(500)
    expect(JSON.stringify(input)).toBe(original)
  })
  it.each(['map-classic', 'spot-guide', 'photo-story'] as const)('keeps %s cards inside their page frames in all paper sizes', template => {
    for (const paper of ['A4', 'A3'] as const) for (const orientation of ['portrait', 'landscape'] as const) {
      const config = { ...defaultPaperMapConfig(template, 40, '長い名称の紙マップ'.repeat(6)), paper, orientation }
      const doc = resolvePaperDocument(source(40), config)
      expect(doc.pages.flatMap(page => page.cards)).toHaveLength(40)
      for (const page of doc.pages) for (const card of page.cards) {
        expect(card.rect.x).toBeGreaterThanOrEqual(page.guideFrame.x)
        expect(card.rect.x + card.rect.width).toBeLessThanOrEqual(doc.width - doc.margin + .01)
        expect(card.rect.y + card.rect.height).toBeLessThanOrEqual(page.guideFrame.y + page.guideFrame.height)
      }
    }
  })
  it('does not leak hidden guide text through continuation pages', () => {
    const config = defaultPaperMapConfig('spot-guide', 100, '地図')
    config.slotState.spotGuide = { visible: false, modified: true }
    const doc = resolvePaperDocument(source(100), config)
    expect(doc.pages).toHaveLength(1); expect(doc.pages[0]!.cards).toHaveLength(0)
  })
  it('uses only source description or explicit override, never an unrelated first field', () => {
    const input = source(1), spot = input.map.floors[0]!.spots[0]!
    spot.description = null; spot.informationFields = [{ id: 'hours', label: '営業時間', value: '10:00', type: 'single_line_text', href: null }]
    const config = defaultPaperMapConfig('spot-guide', 1, input.map.name)
    expect(resolvePaperDocument(input, config).pages[0]!.cards[0]!.summary.lines).toEqual([])
    config.spotOverrides = [{ spotId: spot.id, summary: '利用者が入力した紹介文' }]
    expect(resolvePaperDocument(input, config).pages[0]!.cards[0]!.summary.lines.join('')).toBe('利用者が入力した紹介文')
    expect(spot.description).toBeNull()
  })
  it('retains source pin and viewport geometry including edge coordinates', () => {
    const input = source(3), config = defaultPaperMapConfig('map-classic', 3, input.map.name)
    config.viewport = { mode: 'custom', x: .2, y: .1, width: .6, height: .8 }
    const page = resolvePaperDocument(input, config).pages[0]!, rect = page.imageRect!
    const point = viewportPoint({ x: .5, y: .5 }, page.viewport, rect)
    expect(point.x).toBeCloseTo(rect.x + rect.width / 2)
    expect(point.y).toBeCloseTo(rect.y + rect.height / 2)
    expect(input.map.floors[0]!.spots[0]!.x).toBe(0)
  })
  it('handles unicode and reports shortening instead of inventing summaries', () => {
    const t = paperText('絞り😀と町並みの紹介'.repeat(30), 90, 10, 3)
    expect(t.lines).toHaveLength(3); expect(t.clipped).toBe(true)
    expect(t.lines.at(-1)).toMatch(/…$/)
    expect(t.lines.join('')).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/)
  })
  it('returns zero pages for empty source and indicates unpublished QR omission', () => {
    const config = defaultPaperMapConfig('spot-guide', 0, '有松')
    const doc = resolvePaperDocument(source(0), config)
    expect(doc.pages).toHaveLength(0)
    expect(doc.warnings.join()).toContain('QRは掲載しません')
  })
  it('renders deterministic pages through the same production path used by preview and PDF', async () => {
    const input = source(12), config = defaultPaperMapConfig('spot-guide', 12, input.map.name)
    const renderer = createPaperPageRenderer(input, config, options)
    const one = await renderer.render(0, 72), two = await renderer.render(0, 72)
    expect(createHash('sha256').update(one).digest('hex')).toBe(createHash('sha256').update(two).digest('hex'))
    const printPage = await renderer.render(0, 300)
    const dimensions = await sharp(printPage).metadata()
    expect(dimensions.width).toBeCloseTo(2480, -1)
    expect(dimensions.height).toBeCloseTo(3508, -1)
    const bytes = await generatePaperDocumentPdf(input, config, options)
    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getPageCount()).toBe(renderer.document.pages.length)
    expect(pdf.getPage(0).getWidth()).toBeCloseTo(595.276, 2)
  }, 30000)
  it('invalidates preview confirmation on source or draft changes', () => {
    const input = source(1), config = defaultPaperMapConfig('spot-guide', 1, '有松')
    const token = paperMapPreviewToken(input, config)
    expect(paperMapPreviewToken(structuredClone(input), structuredClone(config))).toBe(token)
    input.map.floors[0]!.spots[0]!.description = '更新された既存データ'
    expect(paperMapPreviewToken(input, config)).not.toBe(token)
    const next = paperMapPreviewToken(input, config)
    config.paperOriginal.title = '紙専用タイトル'
    expect(paperMapPreviewToken(input, config)).not.toBe(next)
  })
  it('refuses a missing map instead of exporting a distribution-looking blank', async () => {
    const input = source(1); input.map.floors[0]!.illustrationUrl = '/uploads/does-not-exist.png'
    const renderer = createPaperPageRenderer(input, defaultPaperMapConfig('map-classic', 1, '有松'), options)
    await expect(renderer.render(0)).rejects.toMatchObject({ statusCode: 422 })
  })
})
