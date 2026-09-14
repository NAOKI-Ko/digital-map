export default defineEventHandler(async (event) => {
  const { tenant } = await requireTenantOwner(event)
  const query = getQuery(event)
  const cursor = typeof query.cursor === 'string' ? query.cursor : undefined
  const events = await prisma.auditEvent.findMany({
    where: { tenantId: tenant.id },
    include: { actorUser: { select: { email: true, displayName: true } } },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 51,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })
  const hasMore = events.length > 50
  const page = events.slice(0, 50)
  return { events: page, nextCursor: hasMore ? page.at(-1)?.id ?? null : null }
})
