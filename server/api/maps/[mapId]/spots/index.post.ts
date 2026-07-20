import { spotFormSchema } from '~~/shared/schemas/spot'
import type { AdminSpotResponse } from '~~/shared/types/spot'

export default defineEventHandler(async (event): Promise<AdminSpotResponse> => {
  const { map } = await requireOwnedMap(event)
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

  const spot = await prisma.spot.create({
    data: {
      ...result.data,
      description: result.data.description || null,
      hoursText: result.data.hoursText || null,
      holidayText: result.data.holidayText || null,
      phone: result.data.phone || null,
    },
    include: adminSpotInclude,
  })

  setResponseStatus(event, 201)
  return {
    spot: toAdminSpotDetail(spot),
    floors: await getMapFloorOptions(map.id),
  }
})
