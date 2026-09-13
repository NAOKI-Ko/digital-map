export default defineEventHandler(async (event) => {
  const { tenant } = await requireTenantOwner(event)
  return { organization: {
    id: tenant.id, name: tenant.name, slug: tenant.slug, logoUrl: tenant.logoUrl,
    logoAssetId: tenant.logoAssetId, websiteUrl: tenant.websiteUrl, snsUrl: tenant.snsUrl,
  } }
})

