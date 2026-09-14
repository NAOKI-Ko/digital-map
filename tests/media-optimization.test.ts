import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateMediaVariants, mediaVariantSpecs, selectMediaVariant } from '../server/utils/media-variants'
import { planMediaGc } from '../server/utils/media-gc'

const roots: string[] = []
afterEach(async () => { while (roots.length) await rm(roots.pop()!, { recursive: true, force: true }) })

function counts(overrides: Partial<Record<string, number>> = {}) {
  return { mapLogos: 0, floorIllustrations: 0, categoryIcons: 0, spotPins: 0, spotPhotos: 0, revisionPhotos: 0, decorations: 0, tenantLogos: 0, ...overrides }
}

describe('Media optimization and GC', () => {
  it('原本を保持してno-upscale WebPを生成し、alphaと寸法を保つ', async () => {
    const root = await mkdtemp(join(tmpdir(), 'media-variants-')); roots.push(root)
    const original = join(root, 'original.png')
    await sharp({ create: { width: 640, height: 320, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 0.5 } } }).png().toFile(original)
    const rows: any[] = []
    const client = {
      mediaVariant: { findMany: vi.fn().mockResolvedValue([]), create: vi.fn(async ({ data }) => { rows.push(data); return data }) },
      mediaAsset: { update: vi.fn() },
    } as any
    await generateMediaVariants(client, { id: 'asset-a', storageKey: 'original.png', width: 640, height: 320 }, root)
    expect(rows.map(row => row.kind)).toEqual(['thumb'])
    const output = await sharp(await readFile(join(root, rows[0].storageKey))).metadata()
    expect(output.format).toBe('webp')
    expect(output.width).toBe(320)
    expect(output.height).toBe(160)
    expect(output.hasAlpha).toBe(true)
    expect(await readFile(original)).toBeTruthy()
  })

  it('既存variantを再生成せず、consumerごとに最小十分な種類を選ぶ', async () => {
    const root = await mkdtemp(join(tmpdir(), 'media-idempotent-')); roots.push(root)
    await sharp({ create: { width: 320, height: 320, channels: 3, background: 'blue' } }).jpeg().toFile(join(root, 'original.jpg'))
    const create = vi.fn()
    const client = { mediaVariant: { findMany: vi.fn().mockResolvedValue([{ kind: 'thumb', format: 'webp' }]), create }, mediaAsset: { update: vi.fn() } } as any
    await generateMediaVariants(client, { id: 'asset-a', storageKey: 'original.jpg', width: 320, height: 320 }, root)
    expect(create).not.toHaveBeenCalled()
    const variants = mediaVariantSpecs.map(spec => ({ kind: spec.kind, storageKey: `${spec.kind}.webp` }))
    expect(selectMediaVariant(variants, 'icon')?.kind).toBe('thumb')
    expect(selectMediaVariant(variants, 'spot-photo')?.kind).toBe('display')
    expect(selectMediaVariant(variants, 'floor')?.kind).toBe('xlarge')
  })

  it('7日graceを過ぎたzero-referenceだけを候補にし、pending revision参照も保護する', () => {
    const now = new Date('2026-09-14T00:00:00Z')
    const old = new Date('2026-09-01T00:00:00Z')
    const recent = new Date('2026-09-13T00:00:00Z')
    const candidates = planMediaGc([
      { id: 'unused', createdAt: old, storageKey: 'unused.png', _count: counts() },
      { id: 'pending', createdAt: old, storageKey: 'pending.png', _count: counts({ revisionPhotos: 1 }) },
      { id: 'shared', createdAt: old, storageKey: 'shared.png', _count: counts({ spotPhotos: 2 }) },
      { id: 'recent', createdAt: recent, storageKey: 'recent.png', _count: counts() },
    ], now, 7)
    expect(candidates.map(asset => asset.id)).toEqual(['unused'])
  })

  it('GC commandは既定dry-runで明示的--deleteのみ削除する', async () => {
    const source = await readFile(new URL('../scripts/media-gc.ts', import.meta.url), 'utf8')
    expect(source).toContain("process.argv.includes('--delete')")
    expect(source).toContain('dryRun: !apply')
    expect(source).toContain('revisionPhotos: true')
  })
})
