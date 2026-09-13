export default defineEventHandler(async (event) => {
  const access = await requireMapAccess(event)
  await requireTenantOwner(event, access.map.tenantId)
  await prisma.map.delete({ where: { id: access.map.id } })
  return { deletedId: access.map.id }
})
