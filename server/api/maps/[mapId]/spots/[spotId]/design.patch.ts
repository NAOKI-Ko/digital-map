import { pinDesignSchema } from '~~/shared/schemas/pin-design'
import type { SpotPinDesignResponse } from '~~/shared/types/spot'

export default defineEventHandler(async (event): Promise<SpotPinDesignResponse> => {
  const { spot } = await requireOwnedSpot(event)
  const result = pinDesignSchema.safeParse(await readBody(event))

  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: result.error.issues[0]?.message ?? 'ピンデザインを確認してください。',
    })
  }

  const updatedSpot = await prisma.spot.update({
    where: { id: spot.id },
    data: {
      pinIconType: result.data.pinIconType,
      pinIconId: result.data.pinIconType === 'preset' ? result.data.pinIconId : null,
      pinIconImageUrl: result.data.pinIconType === 'custom' ? result.data.pinIconImageUrl : null,
      pinColor: result.data.pinColor.toUpperCase(),
    },
    select: {
      pinIconType: true,
      pinIconId: true,
      pinIconImageUrl: true,
      pinColor: true,
    },
  })

  return {
    design: {
      ...updatedSpot,
      pinIconType: updatedSpot.pinIconType === 'custom' ? 'custom' : 'preset',
    },
  }
})
