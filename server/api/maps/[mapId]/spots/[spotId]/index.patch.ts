import { spotFormSchema } from '~~/shared/schemas/spot'
import type { AdminSpotResponse } from '~~/shared/types/spot'

export default defineEventHandler(async (event): Promise<AdminSpotResponse> => {
  const { map, spot: ownedSpot } = await requireOwnedSpot(event)
  const result = spotFormSchema.safeParse(await readBody(event))

  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: result.error.issues[0]?.message ?? '入力内容を確認してください。',
    })
  }

  const floor = await prisma.mapFloor.findFirst({
    where: { id: result.data.floorId, mapId: map.id },
    select: { id: true },
  })
  if (!floor) {
    throw createError({ statusCode: 422, statusMessage: '選択したフロアが見つかりません。' })
  }

  if (ownedSpot.isPublished && (result.data.lat === null || result.data.lng === null)) {
    throw createError({
      statusCode: 422,
      statusMessage: '公開中のスポットから位置を削除できません。先に下書きへ戻してください。',
    })
  }

  const spot = await prisma.spot.update({
    where: { id: ownedSpot.id },
    data: {
      ...result.data,
      description: result.data.description || null,
      hoursText: result.data.hoursText || null,
      holidayText: result.data.holidayText || null,
      phone: result.data.phone || null,
    },
    include: adminSpotInclude,
  })

  return {
    spot: toAdminSpotDetail(spot),
    floors: await getMapFloorOptions(map.id),
  }
})
