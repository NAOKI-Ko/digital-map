import type { MediaAssetUsage } from '~~/shared/types/media'
import type { H3Event } from 'h3'

export interface MediaUsageCounts {
  mapLogos: number
  floorIllustrations: number
  categoryIcons: number
  spotPins: number
  spotPhotos: number
}

export function summarizeMediaUsage(counts: MediaUsageCounts): MediaAssetUsage {
  return {
    ...counts,
    total: counts.mapLogos + counts.floorIllustrations + counts.categoryIcons
      + counts.spotPins + counts.spotPhotos,
  }
}

export async function requireOwnedMediaAsset(event: H3Event) {
  const session = await requireAdminSession(event)
  const assetId = getRouterParam(event, 'assetId')
  if (!assetId) throw createError({ statusCode: 400, statusMessage: '画像IDが必要です。' })

  const asset = await prisma.mediaAsset.findFirst({
    where: { id: assetId, tenantId: session.user.tenantId },
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
  if (!asset) throw createError({ statusCode: 404, statusMessage: '画像が見つかりません。' })
  return { asset, session }
}
