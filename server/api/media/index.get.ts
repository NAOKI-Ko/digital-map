import type { MediaAssetListResponse } from '~~/shared/types/media'

export default defineEventHandler(async (event): Promise<MediaAssetListResponse> => {
  const session = await requireAdminSession(event)
  const assets = await prisma.mediaAsset.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          mapLogos: true,
          floorIllustrations: true,
          categoryIcons: true,
          spotPins: true,
          spotPhotos: true,
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
    })),
  }
})
