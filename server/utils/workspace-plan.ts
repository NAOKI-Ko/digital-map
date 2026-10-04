import { prisma } from './prisma'
import type { WorkspaceUsage } from '../../shared/types/workspace-plan'

// A publication-state metric, not a health probe. READY + own current release +
// isPublished + non-archived is the existing publication contract; no LIVE fallback.
export function isCurrentlyPublishedMap(map: {
  id: string, archivedAt: Date | null, isPublished: boolean,
  currentRelease: { mapId: string, status: string } | null,
}) {
  return map.archivedAt === null && map.isPublished
    && map.currentRelease?.mapId === map.id && map.currentRelease.status === 'READY'
}

export async function resolveWorkspaceUsage(workspaceId: string): Promise<WorkspaceUsage> {
  return prisma.$transaction(async (tx) => {
    const maps = await tx.map.findMany({ where: { tenantId: workspaceId }, select: {
      id: true, archivedAt: true, isPublished: true,
      currentRelease: { select: { mapId: true, status: true } },
    } })
    const assets = await tx.mediaAsset.aggregate({ where: { tenantId: workspaceId }, _sum: { fileSize: true } })
    const variants = await tx.mediaVariant.aggregate({ where: { asset: { tenantId: workspaceId } }, _sum: { fileSize: true } })
    const memberCount = await tx.tenantMember.count({ where: { tenantId: workspaceId, user: { isActive: true } } })
    const publishedMaps = maps.filter(isCurrentlyPublishedMap).length
    const archivedMaps = maps.filter(map => map.archivedAt !== null).length
    return {
      publishedMaps, retainedMaps: maps.length, archivedMaps,
      draftMaps: maps.length - archivedMaps - publishedMaps,
      storageBytes: (assets._sum.fileSize ?? 0) + (variants._sum.fileSize ?? 0), memberCount,
    }
  }, { isolationLevel: 'RepeatableRead' })
}
