import { randomUUID } from 'node:crypto'
import { readFile, stat, unlink } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import sharp from 'sharp'
import type { Prisma } from '~~/prisma/generated/client'

export const mediaVariantSpecs = [
  { kind: 'thumb', maxDimension: 320 },
  { kind: 'display', maxDimension: 1280 },
  { kind: 'large', maxDimension: 2560 },
  { kind: 'xlarge', maxDimension: 4096 },
] as const

export const mediaGcGraceDays = Number(process.env.MEDIA_GC_GRACE_DAYS || 7)

type MediaClient = Prisma.TransactionClient | typeof prisma
type VariantAsset = { id: string, storageKey: string, width: number, height: number }

export async function generateMediaVariants(client: MediaClient, asset: VariantAsset, uploadDirectory: string) {
  const sourcePath = resolve(uploadDirectory, asset.storageKey)
  if (basename(asset.storageKey) !== asset.storageKey) throw new Error('Invalid original storage key')
  const existing = await client.mediaVariant.findMany({ where: { assetId: asset.id }, select: { kind: true, format: true } })
  const present = new Set(existing.map(item => `${item.kind}:${item.format}`))
  const metadata = await sharp(sourcePath).metadata()
  const sourceMax = Math.max(metadata.width ?? asset.width, metadata.height ?? asset.height)
  const created = []
  for (const spec of mediaVariantSpecs) {
    if (spec.maxDimension > sourceMax || present.has(`${spec.kind}:webp`)) continue
    const storageKey = `${asset.id}-${spec.kind}-${randomUUID()}.webp`
    const outputPath = resolve(uploadDirectory, storageKey)
    const pipeline = sharp(sourcePath).rotate().resize({ width: spec.maxDimension, height: spec.maxDimension, fit: 'inside', withoutEnlargement: true })
    const result = await pipeline.webp(metadata.hasAlpha ? { lossless: true } : { quality: 82 }).toFile(outputPath)
    try {
      const variant = await client.mediaVariant.create({ data: { assetId: asset.id, kind: spec.kind, format: 'webp', storageKey, width: result.width, height: result.height, fileSize: (await stat(outputPath)).size } })
      created.push(variant)
    }
    catch (error) {
      await unlink(outputPath).catch(() => undefined)
      throw error
    }
  }
  await client.mediaAsset.update({ where: { id: asset.id }, data: { processingStatus: 'READY', processingError: null } })
  return created
}

export async function processMediaAsset(client: MediaClient, asset: VariantAsset, uploadDirectory: string) {
  try {
    return { status: 'READY' as const, variants: await generateMediaVariants(client, asset, uploadDirectory) }
  }
  catch {
    await client.mediaAsset.update({ where: { id: asset.id }, data: { processingStatus: 'FAILED', processingError: 'VARIANT_GENERATION_FAILED' } })
    return { status: 'FAILED' as const, variants: [] }
  }
}

export function selectMediaVariant<T extends { kind: string, storageKey: string }>(variants: T[], usage: 'spot-photo' | 'icon' | 'logo' | 'decoration' | 'floor') {
  const priorities = usage === 'floor' ? ['xlarge', 'large', 'display'] : usage === 'spot-photo' ? ['display', 'large', 'thumb'] : ['thumb', 'display', 'large']
  return priorities.map(kind => variants.find(variant => variant.kind === kind)).find(Boolean) ?? null
}

export async function inspectVariant(path: string) {
  const bytes = await readFile(path)
  const metadata = await sharp(bytes).metadata()
  return { bytes, metadata }
}
