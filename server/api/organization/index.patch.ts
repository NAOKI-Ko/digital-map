import { organizationSettingsSchema } from '~~/shared/schemas/organization'

export default defineEventHandler(async (event) => {
  const { tenant } = await requireTenantOwner(event)
  const input = await readValidatedBody(event, organizationSettingsSchema.parse)
  if (input.logoAssetId) await resolveTenantMediaAsset(tenant.id, input.logoAssetId)
  const organization = await prisma.tenant.update({ where: { id: tenant.id }, data: input })
  return { organization }
})

