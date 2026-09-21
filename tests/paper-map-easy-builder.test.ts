import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { paperMapConfigSchema, paperDesignRequestSchema } from '../shared/schemas/paper-map'
import { containRect, resolvePaperLayout, resolveViewport, viewportPoint } from '../shared/utils/paper-map-layout'
import { recommendPaperMapConfig, recommendedSpotLimit } from '../shared/utils/paper-map-recommendation'

describe('paper map Easy Builder contract', () => {
  it('turns one purpose choice into a complete deterministic draft', () => {
    const config = recommendPaperMapConfig('MAP_FOCUS', 80, '有松まち歩き')
    expect(paperMapConfigSchema.parse(config)).toEqual(config)
    expect(config).toMatchObject({ paper: 'A4', orientation: 'landscape', layout: 'MAP_FOCUS', sourceMode: 'LIVE', selectionMode: 'recommended', qrEnabled: true })
  })

  it('moves dense maps to A3 and reduces detail without freeform coordinates', () => {
    const config = recommendPaperMapConfig('GUIDE', 81, '地域マップ')
    expect(config.paper).toBe('A3')
    expect(config.density).toBe('names')
    expect(recommendedSpotLimit(config)).toBe(180)
    expect(config).not.toHaveProperty('elements')
  })

  it('rejects empty explicit selections, invalid crop bounds, and inconsistent manual order', () => {
    const base = recommendPaperMapConfig('GUIDE', 10, '案内')
    expect(paperMapConfigSchema.safeParse({ ...base, selectionMode: 'spots' }).success).toBe(false)
    expect(paperMapConfigSchema.safeParse({ ...base, viewport: { mode: 'custom', x: 0.6, y: 0, width: 0.6, height: 1 } }).success).toBe(false)
    expect(paperMapConfigSchema.safeParse({ ...base, order: 'manual' }).success).toBe(false)
  })

  it('keeps image geometry inside the contained image, not the outer frame', () => {
    const image = containRect(1000, 500, { x: 100, y: 100, width: 400, height: 400 })
    expect(image).toEqual({ x: 100, y: 200, width: 400, height: 200 })
    expect(viewportPoint({ x: 0.5, y: 0.5 }, { x: 0, y: 0, width: 1, height: 1 }, image)).toEqual({ x: 300, y: 300 })
  })

  it('fits spots with padding and produces distinct bounded layout families', () => {
    const viewport = resolveViewport(recommendPaperMapConfig('MAP_FOCUS', 2, '地図'), [{ x: 0.4, y: 0.4 }, { x: 0.6, y: 0.6 }])
    expect(viewport.x).toBeCloseTo(0.32)
    const map = recommendPaperMapConfig('MAP_FOCUS', 2, '地図')
    const guide = { ...recommendPaperMapConfig('GUIDE', 2, '案内'), orientation: 'landscape' as const }
    expect(resolvePaperLayout(map, 1000, 700).mapFrame.width).toBeGreaterThan(resolvePaperLayout(guide, 1000, 700).mapFrame.width)
  })

  it('bounds the lightweight design consultation request', () => {
    expect(paperDesignRequestSchema.safeParse({ contactName: '担当者', contactEmail: 'owner@example.jp', organizationName: '地域会', desiredUse: '独自入稿データの相談', desiredDate: '10月' }).success).toBe(true)
    expect(paperDesignRequestSchema.safeParse({ contactName: '担当者', contactEmail: 'invalid', organizationName: '', desiredUse: '相談', desiredDate: '' }).success).toBe(false)
  })

  it('wires access control, current draft PDF, persistence, and the non-Canva UI route', async () => {
    const [pdf, update, schema, editor, navigation] = await Promise.all([
      readFile('server/api/maps/[mapId]/paper-maps/[paperMapId]/pdf.post.ts', 'utf8'),
      readFile('server/api/maps/[mapId]/paper-maps/[paperMapId].patch.ts', 'utf8'),
      readFile('prisma/schema.prisma', 'utf8'),
      readFile('app/pages/admin/maps/[mapId]/paper/[paperMapId].vue', 'utf8'),
      readFile('app/utils/admin-navigation.ts', 'utf8'),
    ])
    expect(pdf).toContain('requireMapAccess(event)')
    expect(pdf).toContain('parsed.data.config')
    expect(update).toContain('PAPER_MAP_UPDATED')
    expect(schema).toContain('model PaperDesignRequest')
    expect(editor).toContain('自由配置は不要です')
    expect(editor).toContain('デザイン制作を相談する')
    expect(navigation).toContain("id: 'paper'")
  })
})
