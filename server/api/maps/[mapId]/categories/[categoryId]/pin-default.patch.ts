import { categoryPinDefaultSchema } from '~~/shared/schemas/pin-source'
import { pinConflict, pinDependentsVersion } from '~~/server/utils/pin-appearance'
import { resolveTenantMediaAsset } from '~~/server/utils/media'
export default defineEventHandler(async (event) => {
  await requireCategoryCanonicalWrite(event)
  const { map } = await requireOwnedMap(event)
  const categoryId = getRouterParam(event, 'categoryId')
  const parsed = categoryPinDefaultSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 422, statusMessage: parsed.error.issues[0]?.message })
  const command = parsed.data
  const design = command.design
  const asset = design && design.pinIconType !== 'preset'
    ? await resolveTenantMediaAsset(map.tenantId, design.pinIconAssetId, 'icon') : null
  if (design && design.pinIconType !== 'preset' && !asset) throw createError({ statusCode: 422, statusMessage: 'メディアから画像を選択してください。' })
  try {
    await prisma.$transaction(async tx => {
      const category = await tx.category.findFirst({ where: { id: categoryId, mapId: map.id, tenantId: map.tenantId } })
      if (!category) throw createError({ statusCode: 404, statusMessage: 'カテゴリーが見つかりません。' })
      const dependents = await tx.spot.findMany({ where: { pinSourceCategoryId: category.id, pinSourceMode: 'category', tenantId: map.tenantId, mapUsage: { mapId: map.id } }, select: { id: true, liveVersion: true } })
      if (category.pinDefaultRevision !== command.expectedRevision || pinDependentsVersion(dependents) !== command.dependentsVersion) throw pinConflict()
      await tx.category.update({ where: { id: category.id, pinDefaultRevision: command.expectedRevision }, data: {
        pinDefaultType: design?.pinIconType ?? null,
        pinDefaultIconId: design?.pinIconType === 'preset' ? design.pinIconId : null,
        pinDefaultImageUrl: asset?.url ?? null, pinDefaultAssetId: asset?.id ?? null,
        pinDefaultColor: design?.pinColor.toUpperCase() ?? null, pinDefaultSize: design?.pinSize ?? null,
        pinDefaultRevision: { increment: 1 },
      } })
      await tx.spot.updateMany({ where: { id: { in: dependents.map(item => item.id) } }, data: { liveVersion: { increment: 1 } } })
    }, { isolationLevel: 'Serializable' })
    return { saved: true }
  }
  catch (error) {
    if (typeof error === 'object' && error && 'code' in error && ['P2034', 'P2025'].includes(String(error.code))) throw pinConflict()
    throw error
  }
})
