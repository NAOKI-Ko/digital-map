import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { PDFDocument } from 'pdf-lib'
import sharp from 'sharp'
import type { PaperMapSource } from '../shared/types/paper-map'
import { paperMapCreateSchema, parsePaperMapConfig } from '../shared/schemas/paper-map'
import {
  paperDesignCatalog,
  paperDesignConfig,
  switchPaperDesign,
  recommendPaperDesign,
  designSuitability,
  offeredPaperDesignCatalog,
  canUsePaperDesign,
} from '../shared/utils/paper-map-designs'
import { defaultPaperMapConfig } from '../shared/utils/paper-map-templates'
import {
  editorialText,
  resolveEditorialDocument,
} from '../shared/utils/paper-map-editorial'
import {
  createEditorialRenderer,
  generateEditorialPdf,
} from '../server/utils/paper-map-editorial-renderer'
import { paperMapPreviewToken } from '../server/utils/paper-map-preview-token'
function fixture(count = 25): PaperMapSource {
  const category = {
    id: 'qa-cat',
    name: 'QAカテゴリー',
    order: 0,
    iconType: 'preset',
    iconPresetId: 'kanji:食',
    iconImageUrl: null,
  }
  return {
    mode: 'LIVE',
    publicUrlAvailable: false,
    spotCount: count,
    photoCount: 0,
    categoryCount: 1,
    map: {
      id: 'qa',
      name: 'QA 検証地図',
      slug: 'qa',
      organizationName: null,
      logoUrl: null,
      websiteUrl: null,
      snsUrl: null,
      locale: 'ja',
      defaultLocale: 'ja',
      enabledLocales: ['ja'],
      seo: { title: '', description: '', imageUrl: null },
      floors: [
        {
          id: 'qa-floor',
          name: 'QAフロア',
          order: 0,
          illustrationUrl: '/uploads/arimatsu-map.png',
          imageWidth: 1448,
          imageHeight: 1086,
          refAImageX: null,
          refAImageY: null,
          refALat: null,
          refALng: null,
          refBImageX: null,
          refBImageY: null,
          refBLat: null,
          refBLng: null,
          decorations: [],
          spots: Array.from({ length: count }, (_, i) => ({
            id: `qa-${i}`,
            floorId: 'qa-floor',
            name: `QA ${i}「長い名前と全角文字」`,
            description: 'QA「公開の紹介文」です。'.repeat(8),
            categories: [category],
            importance: 'normal',
            x: 0.1 + (i % 5) * 0.15,
            y: 0.15 + Math.floor(i / 5) * 0.02,
            photos: [],
            informationFields: [],
            websiteAction: null,
            pinIconType: 'preset',
            pinIconId: 'kanji:●',
            pinIconImageUrl: null,
            pinColor: '#333333',
            pinSize: 'medium',
          })),
        },
      ],
    },
  }
}
const options = {
  publicBaseUrl: 'https://qa.invalid',
  uploadDirectory: resolve('prisma/seed-assets/arimatsu-demo'),
  storage: { put: async () => undefined, get: async () => null },
}
const digest = (v: Uint8Array) => createHash('sha256').update(v).digest('hex')
describe('version 3 bounded editorial design', () => {
  it('offers only the two adopted designs while preserving saved experimental designs', () => {
    expect(offeredPaperDesignCatalog.map(item => item.id)).toEqual(['heritage-map', 'heritage-editorial'])
    for (const id of ['leisure-guide', 'alpine-map', 'neutral-map', 'neutral-guide'] as const) {
      const config = paperDesignConfig(id, fixture(2))
      expect(paperMapCreateSchema.safeParse({ designId: id }).success).toBe(false)
      expect(canUsePaperDesign(config)).toBe(false)
      expect(canUsePaperDesign(config, config)).toBe(true)
      expect(canUsePaperDesign(config, paperDesignConfig('heritage-map', fixture(2)))).toBe(false)
      expect(parsePaperMapConfig(config)).toEqual(config)
    }
    expect(paperMapCreateSchema.safeParse({ designId: 'heritage-map' }).success).toBe(true)
    expect(paperMapCreateSchema.safeParse({ designId: 'heritage-editorial' }).success).toBe(true)
  })
  it.each(paperDesignCatalog)(
    '$id preserves all spots within frames in all paper/orientation combinations',
    (design) => {
      const source = fixture(48),
        before = JSON.stringify(source)
      for (const paper of ['A3', 'A4'] as const)
        for (const orientation of ['portrait', 'landscape'] as const) {
          const config = {
            ...paperDesignConfig(design.id, source),
            paper,
            orientation,
          }
          config.paperOriginal.title = 'QA 日本語の長い題名'.repeat(5)
          const d = resolveEditorialDocument(source, config),
            cards = d.pages.flatMap((p) => p.cards)
          expect(cards.length).toBe(48)
          expect(new Set(cards.map((c) => c.spot.id)).size).toBe(48)
          for (const p of d.pages)
            for (const c of p.cards) {
              expect(c.rect.y + c.rect.height).toBeLessThanOrEqual(
                p.guideFrame.y + p.guideFrame.height + 0.01,
              )
              expect(c.rect.x + c.rect.width).toBeLessThanOrEqual(
                d.width - d.margin + 0.01,
              )
              for (const other of p.cards.filter((x) => x !== c)) {
                const overlap =
                  c.rect.x < other.rect.x + other.rect.width &&
                  c.rect.x + c.rect.width > other.rect.x &&
                  c.rect.y < other.rect.y + other.rect.height &&
                  c.rect.y + c.rect.height > other.rect.y
                expect(overlap).toBe(false)
              }
            }
        }
      expect(JSON.stringify(source)).toBe(before)
    },
  )
  it('old configs round trip exactly; only an explicit design change upgrades', () => {
    for (const version of [1, 2] as const) {
      const old = defaultPaperMapConfig('map-classic', 2, 'QA', version)
      expect(parsePaperMapConfig(old)).toEqual(old)
      const s = fixture(2),
        before = JSON.stringify(old)
      old.paperOriginal.intro = 'QA original'
      old.spotOverrides = [{ spotId: 'qa-0', summary: 'QA override' }]
      const next = switchPaperDesign(old, 'leisure-guide', s)
      expect(next.templateVersion).toBe(3)
      expect(next.paperOriginal.intro).toBe('QA original')
      expect(next.spotOverrides).toEqual(old.spotOverrides)
      expect(old.templateVersion).toBe(version)
      expect(JSON.parse(before).templateVersion).toBe(version)
    }
  })
  it('switches a reactive editor draft without DataCloneError or sharing editable arrays', () => {
    const source = fixture(2),
      config = reactive(paperDesignConfig('heritage-map', source))
    const next = switchPaperDesign(config, 'heritage-editorial', source)
    expect(next.templateId).toBe('photo-story')
    next.selection.spotIds.push('qa-0')
    expect(config.selection.spotIds).toEqual([])
  })
  it('rejects unversioned, future and incompatible pairs', () => {
    const c = paperDesignConfig('heritage-map', fixture())
    expect(() => parsePaperMapConfig({ ...c, design: undefined })).toThrow()
    expect(() =>
      parsePaperMapConfig({ ...c, design: { ...c.design, themeVersion: 2 } }),
    ).toThrow()
    expect(() =>
      parsePaperMapConfig({
        ...c,
        design: { ...c.design, themeId: 'leisure' },
      }),
    ).toThrow()
    expect(() => parsePaperMapConfig({ ...c, templateVersion: 2 })).toThrow()
  })
  it('uses only same-Spot photos, survives stale choices, honors hiding and source summary reset', () => {
    const s = fixture(2),
      spot = s.map.floors[0]!.spots[0]!
    spot.photos = ['/uploads/first.png', '/uploads/second.png']
    const c = paperDesignConfig('heritage-editorial', s)
    c.photoChoices = [{ spotId: spot.id, url: '/uploads/second.png' }]
    c.spotOverrides = [{ spotId: spot.id, summary: 'QA paper-only' }]
    let d = resolveEditorialDocument(s, c)
    expect(d.pages[0]!.cards[0]!.photo).toBe('/uploads/second.png')
    expect(d.pages[0]!.cards[0]!.summary.lines.join('')).toBe('QA paper-only')
    c.photoChoices[0]!.url = '/uploads/other-spot.png'
    c.spotOverrides = []
    d = resolveEditorialDocument(s, c)
    expect(d.pages[0]!.cards[0]!.photo).toBe('/uploads/first.png')
    expect(d.warnings.join()).toContain('現在の写真')
    expect(d.pages[0]!.cards[0]!.summary.lines.join('')).toContain('公開')
    c.slotState.photoFeature = { visible: false, modified: true }
    expect(
      resolveEditorialDocument(s, c).pages[0]!.cards.every((x) => !x.photo),
    ).toBe(true)
  })
  it('avoids invented descriptions, exposes missing-photo suitability, recommends neutral with weak evidence', () => {
    const s = fixture(1)
    s.map.floors[0]!.spots[0]!.description = null
    const c = paperDesignConfig('heritage-editorial', s)
    expect(
      resolveEditorialDocument(s, c).pages[0]!.cards[0]!.summary.lines,
    ).toEqual([])
    expect(designSuitability('heritage-editorial', s)).toContain('写真が少')
    expect(recommendPaperDesign(s).id).toBe('heritage-map')
  })
  it('does not silently omit hidden-guide map selection and never mutates geometry', () => {
    const s = fixture(100),
      before = JSON.stringify(s),
      c = paperDesignConfig('alpine-map', s)
    c.slotState.spotGuide = { visible: false, modified: true }
    c.viewport = { mode: 'custom', x: 0.1, y: 0.1, width: 0.8, height: 0.8 }
    const d = resolveEditorialDocument(s, c)
    expect(d.selectedCount).toBe(100)
    expect(d.pages).toHaveLength(1)
    expect(d.pages[0]!.cards).toHaveLength(0)
    expect(JSON.stringify(s)).toBe(before)
  })
  it('handles punctuation, emoji, and explicit shortening', () => {
    const t = editorialText('あいうえお。かき「くけ」さし😀すせそ', 50, 10, 20)
    expect(t.lines.join('')).toBe('あいうえお。かき「くけ」さし😀すせそ')
    for (const line of t.lines) {
      expect(line).not.toMatch(/^[。、」]/)
      expect(line).not.toMatch(/[「]$/)
    }
    expect(editorialText('長い文章'.repeat(50), 70, 9.5, 3).clipped).toBe(true)
  })
  it('reports removed saved references even when other selected spots remain', () => {
    const source = fixture(2), config = paperDesignConfig('heritage-map', source)
    config.selection = { mode: 'spots', categoryIds: [], spotIds: ['qa-0', 'removed-spot'] }
    config.ordering = { mode: 'manual', spotIds: ['removed-spot', 'qa-0'] }
    const document = resolveEditorialDocument(source, config)
    expect(document.pages.flatMap(page => page.cards).map(card => card.spot.id)).toEqual(['qa-0'])
    expect(document.warnings.join()).toContain('元データから削除')
  })
  it('source, photo, and Paper Original changes invalidate freshness confirmation', () => {
    const s = fixture(1),
      c = paperDesignConfig('heritage-map', s),
      a = paperMapPreviewToken(s, c)
    c.paperOriginal.notice = 'QA notice'
    expect(paperMapPreviewToken(s, c)).not.toBe(a)
    const b = paperMapPreviewToken(s, c)
    s.map.floors[0]!.spots[0]!.photos = ['/uploads/new.png']
    expect(paperMapPreviewToken(s, c)).not.toBe(b)
  })
  it('keeps the enlarged A3 QR clear of all source cards and within print margins', () => {
    const source = fixture(48)
    source.publicUrlAvailable = true
    const config = paperDesignConfig('heritage-map', source)
    const document = resolveEditorialDocument(source, config)
    for (const page of document.pages) {
      const qr = document.regions(page).find(region => region.slot === 'qr')!
      expect(qr.x + qr.width).toBeLessThan(document.width)
      expect(qr.y + qr.height).toBeLessThan(document.height)
      expect(page.cards.every(card => card.rect.y + card.rect.height < qr.y)).toBe(true)
    }
    expect(document.pages.flatMap(page => page.cards)).toHaveLength(48)
  })
  it('deterministically renders shared pages and encodes a print-size JPEG PDF', async () => {
    const s = fixture(2),
      c = paperDesignConfig('heritage-map', s),
      r = createEditorialRenderer(s, c, options)
    const one = await r.render(0, 72)
    expect(digest(one)).toBe(digest(await r.render(0, 72)))
    const jpeg = await r.render(0, 240, 'jpeg')
    expect((await sharp(jpeg).metadata()).width).toBe(3969)
    const pdf = await PDFDocument.load(
      await generateEditorialPdf(s, c, options),
    )
    expect(pdf.getPageCount()).toBe(r.document.pages.length)
    expect(pdf.getPage(0).getWidth()).toBeCloseTo(1190.55, 1)
  }, 30000)
  it('fails a missing map but falls back for optional broken category/photo assets', async () => {
    const s = fixture(1)
    s.map.floors[0]!.spots[0]!.photos = ['/uploads/missing-photo.png']
    s.map.floors[0]!.spots[0]!.categories[0]!.iconImageUrl =
      '/uploads/missing-icon.png'
    const c = paperDesignConfig('heritage-editorial', s),
      r = createEditorialRenderer(s, c, options)
    expect((await r.render(0, 72)).length).toBeGreaterThan(1000)
    expect([...r.warnings].join()).toContain('読み込めない')
    s.map.floors[0]!.illustrationUrl = '/uploads/missing.png'
    await expect(
      createEditorialRenderer(s, c, options).render(0, 72),
    ).rejects.toMatchObject({ statusCode: 422 })
  })
})
