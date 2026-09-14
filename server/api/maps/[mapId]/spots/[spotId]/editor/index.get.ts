export default defineEventHandler(async (event) => {
  const { map, spot } = await requireOwnedSpot(event)
  const [assignment, members] = await Promise.all([
    prisma.spotEditorAssignment.findUnique({ where: { spotId: spot.id }, include: { user: { select: { email: true, displayName: true } } } }),
    prisma.tenantMember.findMany({ where: { tenantId: map.tenantId, role: 'MEMBER' }, include: { user: { select: { email: true, displayName: true } } }, orderBy: { createdAt: 'asc' } }),
  ])
  return { assignment, members: members.map(member => ({ userId: member.userId, ...member.user })) }
})
