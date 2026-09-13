import { pinDesignSchema } from '~~/shared/schemas/pin-design'
import { normalizePinIconType } from '~~/shared/constants/spot'
import type { SpotPinDesignResponse } from '~~/shared/types/spot'
import { resolveTenantMediaAsset } from '~~/server/utils/media'

export default defineEventHandler(async (event): Promise<SpotPinDesignResponse> => {
  const { spot, session } = await requireOwnedSpot(event)
  const result = pinDesignSchema.safeParse(await readBody(event))

  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: result.error.issues[0]?.message ?? 'ピンデザインを確認してください。',
    })
  }

  const asset = await resolveTenantMediaAsset(session.user.tenantId, result.data.pinIconAssetId)
  const updatedSpot = await prisma.spot.update({
    where: { id: spot.id },
    data: {
      pinIconType: result.data.pinIconType,
      pinIconId: result.data.pinIconType === 'preset' ? result.data.pinIconId : null,
      pinIconImageUrl: result.data.pinIconType === 'preset' ? null : (asset?.url ?? result.data.pinIconImageUrl),
      pinIconAssetId: result.data.pinIconType === 'preset' ? null : asset?.id,
      pinColor: result.data.pinColor.toUpperCase(),
    },
    select: {
      pinIconType: true,
      pinIconId: true,
      pinIconImageUrl: true,
      pinIconAssetId: true,
      pinColor: true,
    },
  })

  return {
    design: {
      ...updatedSpot,
      pinIconType: normalizePinIconType(updatedSpot.pinIconType),
    },
  }
})
