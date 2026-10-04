export default defineEventHandler(async (event) => {
  const session = await requireUser(event)
  const assignments = await prisma.spotEditorAssignment.findMany({
    where: { userId: session.user.id, spot: { tenantId: session.user.tenantId, mapUsage: { map: { archivedAt: null } } } },
    include: { spot: { include: { floor: { include: { map: { select: { id: true, name: true } } } }, mapUsage: { include: { map: { select: { id: true, name: true } } } }, revisions: { where: { status: 'PENDING' }, select: { id: true, authorId: true } } } } },
  })
  return { spots: assignments.map(item => item.spot) }
})
