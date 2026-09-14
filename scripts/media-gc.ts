import 'dotenv/config'
import { unlink } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { planMediaGc } from '../server/utils/media-gc'
import { prisma } from '../server/utils/prisma'

const uploadDirectory = resolve(process.env.NUXT_UPLOAD_DIR || './public/uploads')
const apply = process.argv.includes('--delete')
const assets = await prisma.mediaAsset.findMany({ include: {
  variants: true,
  _count: { select: { mapLogos: true, floorIllustrations: true, categoryIcons: true, spotPins: true, spotPhotos: true, revisionPhotos: true, decorations: true, tenantLogos: true } },
} })
const candidates = planMediaGc(assets)
console.info(JSON.stringify({ dryRun: !apply, graceDays: Number(process.env.MEDIA_GC_GRACE_DAYS || 7), candidates: candidates.map(asset => ({ id: asset.id, storageKey: asset.storageKey })) }, null, 2))
if (apply) {
  for (const asset of candidates) {
    await prisma.$transaction(async (transaction) => {
      await transaction.auditEvent.create({ data: { tenantId: asset.tenantId, actorUserId: null, action: 'MEDIA_ASSET_PHYSICALLY_DELETED', targetType: 'MediaAsset', targetId: asset.id, metadata: { source: 'media-gc', usageCount: 0 } } })
      await transaction.mediaAsset.delete({ where: { id: asset.id } })
    })
    for (const key of [asset.storageKey, ...asset.variants.map(variant => variant.storageKey)]) if (basename(key) === key) await unlink(resolve(uploadDirectory, key)).catch(() => undefined)
  }
}
await prisma.$disconnect()
