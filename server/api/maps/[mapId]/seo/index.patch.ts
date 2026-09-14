import { mapSeoSchema } from '~~/shared/schemas/seo'

export default defineEventHandler(async (event) => {
  const { map } = await requireMapAccess(event)
  const result = mapSeoSchema.safeParse(await readBody(event))
  if (!result.success) throw createError({ statusCode: 422, statusMessage: result.error.issues[0]?.message ?? 'SEO設定を確認してください。' })
  if (result.data.imageAssetId) await resolveTenantMediaAsset(map.tenantId, result.data.imageAssetId, 'spot-photo')
  const updated = await prisma.map.update({ where: { id: map.id }, data: {
    seoTitle: result.data.title || null,
    seoDescription: result.data.description || null,
    seoImageAssetId: result.data.imageAssetId || null,
  }, select: { seoTitle: true, seoDescription: true, seoImageAssetId: true } })
  return { seo: updated }
})
