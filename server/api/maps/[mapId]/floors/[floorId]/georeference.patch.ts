import { geoReferenceSchema } from '~~/shared/schemas/georeference'
import type { MapFloorResponse } from '~~/shared/types/floor'
import { getGeoReferenceValidationError } from '~~/lib/geo'

export default defineEventHandler(async (event): Promise<MapFloorResponse> => {
  const { floor } = await requireOwnedFloor(event)
  const result = geoReferenceSchema.safeParse(await readBody(event))

  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: result.error.issues[0]?.message ?? '基準点の値を確認してください。',
    })
  }

  if (!floor.imageWidth || !floor.imageHeight) {
    throw createError({
      statusCode: 422,
      statusMessage: '画像の幅と高さが未登録です。フロア画像を再アップロードしてください。',
    })
  }

  const validationError = getGeoReferenceValidationError({
    imageWidth: floor.imageWidth,
    imageHeight: floor.imageHeight,
    ...result.data,
  })
  if (validationError) {
    throw createError({ statusCode: 422, statusMessage: validationError })
  }

  const updatedFloor = await prisma.mapFloor.update({
    where: { id: floor.id },
    data: result.data,
    include: { _count: { select: { spots: true } } },
  })

  return { floor: toMapFloorItem(updatedFloor) }
})
