import type { MediaAssetUsage } from '~~/shared/types/media'
import type { H3Event } from 'h3'

export interface MediaUsageCounts {
  mapLogos: number
  floorIllustrations: number
  categoryIcons: number
  spotPins: number
  spotPhotos: number
  decorations: number
}

export function summarizeMediaUsage(counts: MediaUsageCounts): MediaAssetUsage {
  return {
    ...counts,
    total: counts.mapLogos + counts.floorIllustrations + counts.categoryIcons
      + counts.spotPins + counts.spotPhotos + counts.decorations,
  }
}

export async function resolveTenantMediaAsset(tenantId: string, assetId: string | null | undefined) {
  if (!assetId) return null
  const asset = await prisma.mediaAsset.findFirst({ where: { id: assetId, tenantId } })
  if (!asset) throw createError({ statusCode: 422, statusMessage: '選択した登録画像が見つかりません。' })
  return { id: asset.id, url: `/uploads/${asset.storageKey}`, width: asset.width, height: asset.height }
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
          decorations: true,
        },
      },
    },
  })
  if (!asset) throw createError({ statusCode: 404, statusMessage: '画像が見つかりません。' })
  return { asset, session }
}
