import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import type { PublicMap } from '../shared/types/public-map'
import { generateMapPdf, pdfPageSize, publicMapQrPayload } from '../server/utils/map-pdf'

const storage = { put: async () => undefined, get: async () => null }

function fixture(floorCount = 1, spotCount = 2): PublicMap {
  return {
    id: 'map-1', name: 'テスト地域マップ', slug: 'test-map', locale: 'ja', defaultLocale: 'ja', enabledLocales: ['ja'], seo: { title: 'テスト', description: '', imageUrl: null }, organizationName: '地域会', logoUrl: null, websiteUrl: null, snsUrl: null,
    floors: Array.from({ length: floorCount }, (_, floorIndex) => ({
      id: `floor-${floorIndex + 1}`, name: `${floorIndex + 1}階`, illustrationUrl: '/uploads/missing.png', imageWidth: 1000, imageHeight: 800, order: floorIndex, refAImageX: null, refAImageY: null, refALat: null, refALng: null, refBImageX: null, refBImageY: null, refBLat: null, refBLng: null, decorations: [],
      spots: Array.from({ length: spotCount }, (_, spotIndex) => ({ id: `spot-${floorIndex}-${spotIndex}`, floorId: `floor-${floorIndex + 1}`, name: `スポット ${String(spotIndex + 1).padStart(2, '0')}`, categories: [{ id: 'category-1', name: '施設', order: 0, iconType: 'PRESET', iconPresetId: 'place', iconImageUrl: null, iconAssetId: null }], importance: 'NORMAL', description: null, x: 100 + spotIndex * 20, y: 120 + spotIndex * 10, photos: [], informationFields: [], websiteAction: null, pinIconType: 'PRESET', pinIconId: 'place', pinIconImageUrl: null, pinColor: '#c2412d', pinSize: 'MEDIUM',
      })),
    })),
  }
}

describe('paper map PDF', () => {
  it.each([
    ['A4', 'portrait', 210, 297], ['A4', 'landscape', 297, 210], ['A3', 'portrait', 297, 420], ['A3', 'landscape', 420, 297],
  ] as const)('uses exact %s %s page dimensions', (paper, orientation, widthMm, heightMm) => {
    const size = pdfPageSize(paper, orientation)
    expect(size.widthMm).toBe(widthMm)
    expect(size.heightMm).toBe(heightMm)
    expect(size.widthPx).toBe(Math.round(widthMm / 25.4 * 300))
  })

  it('creates a parseable multi-floor PDF from the current release shape', async () => {
    const bytes = await generateMapPdf(fixture(2), { paper: 'A4', orientation: 'landscape', floorMode: 'all' }, { preview: false, publicBaseUrl: 'https://maps.example.test', uploadDirectory: '/tmp/no-uploads', storage })
    if (process.env.PDF_SAMPLE_OUTPUT) {
      await mkdir(dirname(process.env.PDF_SAMPLE_OUTPUT), { recursive: true })
      await writeFile(process.env.PDF_SAMPLE_OUTPUT, bytes)
    }
    const parsed = await PDFDocument.load(bytes)
    expect(parsed.getPageCount()).toBe(2)
    expect(parsed.getPage(0).getWidth()).toBeCloseTo(297 * 72 / 25.4, 4)
  }, 30_000)

  it('flows a long Spot legend to an additional page and allows unpublished preview without QR', async () => {
    const bytes = await generateMapPdf(fixture(1, 25), { paper: 'A4', orientation: 'portrait', floorMode: 'selected', floorId: 'floor-1' }, { preview: true, publicBaseUrl: 'https://maps.example.test', uploadDirectory: '/tmp/no-uploads', storage })
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(2)
  }, 30_000)

  it('builds the exact configured public QR payload', () => {
    expect(publicMapQrPayload('https://public.example.test/maps-root/', '駅 & 商店')).toBe('https://public.example.test/%E9%A7%85%20%26%20%E5%95%86%E5%BA%97')
  })

  it('keeps source-of-truth, authorization, map objects, and print layers explicit', async () => {
    const [endpoint, generator] = await Promise.all([readFile('server/api/maps/[mapId]/pdf.post.ts', 'utf8'), readFile('server/utils/map-pdf.ts', 'utf8')])
    expect(endpoint).toContain('requireMapAccess(event)')
    expect(endpoint).toContain('loadCurrentPublicSnapshot')
    expect(endpoint).toContain('getLivePublicMapById')
    expect(generator).toContain('floor.decorations')
    expect(generator).toContain('map.logoUrl')
    expect(generator).toContain('spot.pinColor')
    expect(generator).toContain('QRCode.toBuffer')
    expect(generator).toContain('未公開プレビュー')
  })
})
