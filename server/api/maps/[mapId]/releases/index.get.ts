export default defineEventHandler(async (event) => {
  const { map } = await requireMapAccess(event)
  const [state, releases] = await Promise.all([
    prisma.map.findUniqueOrThrow({ where: { id: map.id }, select: { currentReleaseId: true } }),
    prisma.publicRelease.findMany({ where: { mapId: map.id, status: 'READY' }, orderBy: { createdAt: 'desc' }, select: { id: true, createdAt: true, readyAt: true } }),
  ])
  return { currentReleaseId: state.currentReleaseId, releases: releases.map(release => ({ ...release, createdAt: release.createdAt.toISOString(), readyAt: release.readyAt?.toISOString() ?? null })) }
})
