import type { MediaAssetListResponse } from '~~/shared/types/media'
import { summarizeMediaUsage } from '~~/server/utils/media'

export default defineEventHandler(async (event): Promise<MediaAssetListResponse> => {
  const { session } = await requireTenantMediaAccess(event)
  const assets = await prisma.mediaAsset.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      mapLogos: { select: { id: true } },
      floorIllustrations: { select: { mapId: true } },
      categoryIcons: { select: { mapId: true } },
      spotPins: { select: { floor: { select: { mapId: true } } } },
      spotPhotos: { select: { spot: { select: { floor: { select: { mapId: true } } } } } },
      decorations: { select: { floor: { select: { mapId: true } } } },
      _count: {
        select: {
          mapLogos: true,
          floorIllustrations: true,
          categoryIcons: true,
          spotPins: true,
          spotPhotos: true,
          decorations: true,
          tenantLogos: true,
        },
      },
    },
  })

  return {
    assets: assets.map(asset => ({
      id: asset.id,
      url: `/uploads/${asset.storageKey}`,
      originalFilename: asset.originalFilename,
      mimeType: asset.mimeType,
      width: asset.width,
      height: asset.height,
      fileSize: asset.fileSize,
      sha256: asset.sha256,
      createdAt: asset.createdAt.toISOString(),
      usage: summarizeMediaUsage(asset._count),
      usedInMapIds: [...new Set([
        ...asset.mapLogos.map(map => map.id),
        ...asset.floorIllustrations.map(floor => floor.mapId),
        ...asset.categoryIcons.map(category => category.mapId),
        ...asset.spotPins.map(spot => spot.floor.mapId),
        ...asset.spotPhotos.map(photo => photo.spot.floor.mapId),
        ...asset.decorations.map(decoration => decoration.floor.mapId),
      ])],
    })),
  }
})
