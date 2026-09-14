import type { MediaAssetListResponse } from '~~/shared/types/media'
import { summarizeMediaUsage } from '~~/server/utils/media'
import { selectMediaVariant } from '~~/server/utils/media-variants'

export default defineEventHandler(async (event): Promise<MediaAssetListResponse> => {
  const { session } = await requireTenantMediaAccess(event)
  const assets = await prisma.mediaAsset.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      mapLogos: { select: { id: true } },
      mapSeoImages: { select: { id: true } },
      floorIllustrations: { select: { mapId: true } },
      categoryIcons: { select: { mapId: true } },
      spotPins: { select: { floor: { select: { mapId: true } } } },
      spotPhotos: { select: { spot: { select: { floor: { select: { mapId: true } } } } } },
      revisionPhotos: { select: { revision: { select: { spot: { select: { floor: { select: { mapId: true } } } } } } } },
      decorations: { select: { floor: { select: { mapId: true } } } },
      _count: {
        select: {
          mapLogos: true,
          mapSeoImages: true,
          floorIllustrations: true,
          categoryIcons: true,
          spotPins: true,
          spotPhotos: true,
          revisionPhotos: true,
          decorations: true,
          tenantLogos: true,
        },
      },
      variants: { orderBy: { width: 'asc' } },
    },
  })

  return {
    assets: assets.map((asset) => {
      const displayVariant = selectMediaVariant(asset.variants, 'spot-photo')
      return {
      id: asset.id,
      url: `/uploads/${displayVariant?.storageKey ?? asset.storageKey}`,
      originalFilename: asset.originalFilename,
      mimeType: asset.mimeType,
      width: asset.width,
      height: asset.height,
      fileSize: asset.fileSize,
      sha256: asset.sha256,
      processingStatus: asset.processingStatus,
      variants: asset.variants.map(variant => ({ kind: variant.kind, url: `/uploads/${variant.storageKey}`, width: variant.width, height: variant.height, fileSize: variant.fileSize })),
      createdAt: asset.createdAt.toISOString(),
      usage: summarizeMediaUsage(asset._count),
      usedInMapIds: [...new Set([
        ...asset.mapLogos.map(map => map.id),
        ...asset.mapSeoImages.map(map => map.id),
        ...asset.floorIllustrations.map(floor => floor.mapId),
        ...asset.categoryIcons.map(category => category.mapId),
        ...asset.spotPins.map(spot => spot.floor.mapId),
        ...asset.spotPhotos.map(photo => photo.spot.floor.mapId),
        ...asset.revisionPhotos.map(photo => photo.revision.spot.floor.mapId),
        ...asset.decorations.map(decoration => decoration.floor.mapId),
      ])],
      }
    }),
  }
})
