export default defineEventHandler(async event => {
  const { session } = await requireTenantOwner(event)
  return { spots: await prisma.spot.findMany({ where: { tenantId: session.user.tenantId }, select: { id: true, name: true, contentVersion: true, schemaMapId: true, mapUsage: { select: { mapId: true, map: { select: { name: true, archivedAt: true } } } } }, orderBy: [{ name: 'asc' }, { id: 'asc' }] }) }
})
