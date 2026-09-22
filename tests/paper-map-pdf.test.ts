import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { describe, expect, it } from 'vitest'
import type { PaperMapSource } from '../shared/types/paper-map'
import type { PublicMap } from '../shared/types/public-map'
import { recommendPaperMapConfig } from '../shared/utils/paper-map-recommendation'
import { generatePaperMapPdf } from '../server/utils/paper-map-pdf'

const storage = { put: async () => undefined, get: async () => null }
const map: PublicMap = {
  id: 'map-1', name: '有松まち歩きマップ', slug: 'arimatsu', locale: 'ja', defaultLocale: 'ja', enabledLocales: ['ja'], seo: { title: '有松', description: '', imageUrl: null }, organizationName: '有松地域会', logoUrl: null, websiteUrl: null, snsUrl: null,
  floors: [{
    id: 'floor-1', name: 'まちなみ', illustrationUrl: '/uploads/missing.png', imageWidth: 1200, imageHeight: 700, order: 0, refAImageX: null, refAImageY: null, refALat: null, refALng: null, refBImageX: null, refBImageY: null, refBLat: null, refBLng: null, decorations: [],
    spots: Array.from({ length: 12 }, (_, index) => ({ id: `spot-${index}`, floorId: 'floor-1', name: `見どころ ${index + 1}`, categories: [{ id: 'category-1', name: '見どころ', order: 0, iconType: 'PRESET', iconPresetId: 'place', iconImageUrl: null, iconAssetId: null }], importance: index < 2 ? 'featured' : 'normal', description: '歴史ある町並みの見どころです', x: 0.1 + (index % 4) * 0.22, y: 0.15 + Math.floor(index / 4) * 0.3, photos: [], informationFields: [], websiteAction: null, pinIconType: 'PRESET', pinIconId: 'place', pinIconImageUrl: null, pinColor: '#b4532a', pinSize: 'MEDIUM' })),
  }],
}
const source: PaperMapSource = { mode: 'LIVE', map, spotCount: 12, categoryCount: 1, photoCount: 0 }

describe('paper map v2 PDF renderer', () => {
  it.each([
    ['MAP_FOCUS', 'A4', 'landscape'],
    ['GUIDE', 'A4', 'portrait'],
    ['PHOTO_GUIDE', 'A3', 'portrait'],
    ['GUIDE', 'A3', 'landscape'],
  ] as const)('creates parseable %s %s %s output', async (purpose, paper, orientation) => {
    const config = { ...recommendPaperMapConfig(purpose, 12, map.name), paper, orientation, templateVersion: 1 as const }
    const bytes = await generatePaperMapPdf(source, config, { publicBaseUrl: 'https://maps.example.test', uploadDirectory: '/tmp/no-uploads', storage })
    const parsed = await PDFDocument.load(bytes)
    expect(parsed.getPageCount()).toBe(1)
    expect(bytes.byteLength).toBeGreaterThan(10_000)
    if (process.env.PAPER_MAP_PDF_SAMPLE && purpose === 'MAP_FOCUS') {
      await mkdir(dirname(process.env.PAPER_MAP_PDF_SAMPLE), { recursive: true })
      await writeFile(process.env.PAPER_MAP_PDF_SAMPLE, bytes)
    }
  }, 30_000)
})
