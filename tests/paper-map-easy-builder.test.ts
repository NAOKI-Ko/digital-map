import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { migratePaperMapConfigV1, paperDesignRequestSchema, paperMapConfigSchema, paperMapConfigV2Schema, parsePaperMapConfig, type PaperMapConfigV1 } from '../shared/schemas/paper-map'
import { containRect, resolvePaperLayout, resolveViewport, viewportPoint } from '../shared/utils/paper-map-layout'
import { recommendPaperMapConfig, recommendedSpotLimit } from '../shared/utils/paper-map-recommendation'
import { defaultPaperMapConfig, resolvePaperTemplate, slotVisible, switchPaperTemplate, templateSuitability } from '../shared/utils/paper-map-templates'

const v1 = (purpose: PaperMapConfigV1['purpose'], layout: PaperMapConfigV1['layout']): PaperMapConfigV1 => ({ purpose, sourceMode: 'LIVE', paper: 'A4', orientation: 'landscape', layout, mapSize: 'standard', selectionMode: 'recommended', categoryIds: [], spotIds: [], density: 'detail', photos: purpose === 'PHOTO_GUIDE' ? 'featured' : 'none', order: 'auto', manualSpotIds: [], qrEnabled: true, qrLabel: '詳しくはWebへ', logoEnabled: true, theme: 'brand', viewport: { mode: 'fit_spots' }, title: '有松まち歩き', subtitle: '' })

describe('paper map Template Studio v2 contract', () => {
  it.each([
    ['MAP_FOCUS', 'MAP_FOCUS', 'map-classic'],
    ['GUIDE', 'GUIDE', 'spot-guide'],
    ['GUIDE', 'BALANCED', 'spot-guide'],
    ['PHOTO_GUIDE', 'GUIDE', 'photo-story'],
  ] as const)('migrates v1 %s/%s deterministically', (purpose, layout, templateId) => {
    const migrated = migratePaperMapConfigV1(v1(purpose, layout))
    expect(migrated).toMatchObject({ version: 2, templateId, templateVersion: 1, paperOriginal: { title: '有松まち歩き' } })
    expect(parsePaperMapConfig(v1(purpose, layout))).toEqual(migrated)
  })

  it('round-trips v2 and rejects unknown config/template versions', () => {
    const config = defaultPaperMapConfig('map-classic', 12, '有松')
    expect(paperMapConfigV2Schema.parse(config)).toEqual(config)
    expect(() => parsePaperMapConfig({ ...config, version: 3 })).toThrow()
    expect(() => resolvePaperTemplate('map-classic', 4)).toThrow('Unknown paper template version')
  })

  it('creates complete bounded drafts and validates selection/crop/order', () => {
    const config = recommendPaperMapConfig('MAP_FOCUS', 12, '有松まち歩き')
    expect(paperMapConfigSchema.parse(config)).toEqual(config)
    expect(config).toMatchObject({ version: 2, templateId: 'map-classic', paper: 'A4', orientation: 'landscape', sourceMode: 'LIVE', selection: { mode: 'recommended' } })
    expect(config).not.toHaveProperty('elements')
    expect(paperMapConfigV2Schema.safeParse({ ...config, selection: { ...config.selection, mode: 'spots' } }).success).toBe(false)
    expect(paperMapConfigV2Schema.safeParse({ ...config, viewport: { mode: 'custom', x: .6, y: 0, width: .6, height: 1 } }).success).toBe(false)
    expect(paperMapConfigV2Schema.safeParse({ ...config, ordering: { mode: 'manual', spotIds: [] } }).success).toBe(false)
  })

  it('uses deterministic suitability including photos, no-photo, and high counts', () => {
    expect(templateSuitability({ spotCount: 8, photoCount: 6 }).recommended).toBe('photo-story')
    expect(templateSuitability({ spotCount: 10, photoCount: 0 }).recommended).toBe('spot-guide')
    expect(templateSuitability({ spotCount: 40, photoCount: 30 }).recommended).toBe('map-classic')
  })

  it('preserves content and hidden slot state through template switches', () => {
    const original = defaultPaperMapConfig('photo-story', 8, '有松')
    original.paperOriginal.intro = '紙面だけの導入文'
    original.spotOverrides = [{ spotId: 'spot-1', summary: '紙面用紹介' }]
    original.slotState.intro = { visible: false, modified: true }
    const away = switchPaperTemplate(original, 'map-classic')
    const back = switchPaperTemplate(away, 'photo-story')
    expect(back.paperOriginal.intro).toBe('紙面だけの導入文')
    expect(back.spotOverrides).toEqual(original.spotOverrides)
    expect(slotVisible(back, 'intro')).toBe(false)
    expect(slotVisible(back, 'photoFeature')).toBe(true)
  })

  it('keeps shared image geometry and distinct template layouts', () => {
    const image = containRect(1000, 500, { x: 100, y: 100, width: 400, height: 400 })
    expect(image).toEqual({ x: 100, y: 200, width: 400, height: 200 })
    expect(viewportPoint({ x: .5, y: .5 }, { x: 0, y: 0, width: 1, height: 1 }, image)).toEqual({ x: 300, y: 300 })
    const config = defaultPaperMapConfig('map-classic', 2, '地図', 1)
    expect(resolveViewport(config, [{ x: .4, y: .4 }, { x: .6, y: .6 }]).x).toBeCloseTo(.32)
    const guide = { ...defaultPaperMapConfig('spot-guide', 2, '案内'), orientation: 'landscape' as const }
    expect(resolvePaperLayout(config, 1000, 700).mapFrame.width).toBeGreaterThan(resolvePaperLayout(guide, 1000, 700).mapFrame.width)
    expect(recommendedSpotLimit(defaultPaperMapConfig('spot-guide', 81, '地域'))).toBe(180)
  })

  it('bounds consultation and wires RBAC, v2 persistence, viewport UI, and consultation', async () => {
    expect(paperDesignRequestSchema.safeParse({ contactName: '担当者', contactEmail: 'owner@example.jp', organizationName: '地域会', desiredUse: '独自入稿データの相談', desiredDate: '10月' }).success).toBe(true)
    const [pdf, update, editor] = await Promise.all([readFile('server/api/maps/[mapId]/paper-maps/[paperMapId]/pdf.post.ts', 'utf8'), readFile('server/api/maps/[mapId]/paper-maps/[paperMapId].patch.ts', 'utf8'), readFile('app/pages/admin/maps/[mapId]/paper/[paperMapId].vue', 'utf8')])
    expect(pdf).toContain('requireMapAccess(event)')
    expect(update).toContain('validatePaperMapReferences')
    expect(update).toContain('configVersion: 2')
    expect(editor).toContain('完成品を少し直す')
    expect(editor).toContain('自分で調整')
    expect(editor).not.toContain('>X<input')
    expect(editor).toContain('デザイン制作を相談する')
  })
})
