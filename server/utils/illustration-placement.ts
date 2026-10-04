import { z } from 'zod'
import type { Prisma } from '~~/prisma/generated/client'
import { appendAuditEvent } from './audit'
import { prisma } from './prisma'

export async function runPlacementMutation<T>(mutation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  try { return await prisma.$transaction(mutation, { isolationLevel: 'Serializable' }) }
  catch (error) {
    if (error && typeof error === 'object' && 'code' in error && ['P2034', 'P2002', 'P2025'].includes(String(error.code))) throw createError({ statusCode: 409, statusMessage: '配置が更新されています。再読込してください。' })
    throw error
  }
}

export const placementInput = z.object({ floorId: z.string().min(1), x: z.number().finite().min(0).max(1).nullable(), y: z.number().finite().min(0).max(1).nullable() }).refine(value => (value.x === null) === (value.y === null), '座標は両方設定してください。')
export const placementUpdate = z.object({ x: z.number().finite().min(0).max(1).nullable(), y: z.number().finite().min(0).max(1).nullable(), expectedFloorUpdatedAt: z.string().datetime(), expectedVersion: z.number().int().positive() }).refine(value => (value.x === null) === (value.y === null), '座標は両方設定してください。')

/** Project only the primary occurrence for old admin/CSV clients; never move another occurrence. */
export async function refreshPrimaryProjection(tx: Prisma.TransactionClient, usageId: string) {
  const usage = await tx.mapSpotUsage.findUniqueOrThrow({ where: { id: usageId }, include: { placements: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }] } } })
  const primary = usage.placements[0]
  if (primary && !primary.isPrimary) await tx.illustrationPlacement.update({ where: { id: primary.id }, data: { isPrimary: true } })
  await tx.spot.update({ where: { id: usage.spotId }, data: { floorId: primary?.floorId ?? null, x: primary?.x ?? null, y: primary?.y ?? null, liveVersion: { increment: 1 } } })
}

export async function recordPlacementAudit(tx: Prisma.TransactionClient, context: { map: { id: string, tenantId: string }, session: { user: { id: string } } }, action: string, placementId: string, spotId: string) {
  await appendAuditEvent(tx, { tenantId: context.map.tenantId, actorUserId: context.session.user.id, action, targetType: 'IllustrationPlacement', targetId: placementId, mapId: context.map.id, metadata: { spotId } })
}

/** Publication is a Usage decision, valid if any occurrence remains positioned. */
export async function reconcileUsagePublication(tx: Prisma.TransactionClient, usageId: string, bumpLegacyVersion = true) {
  const usage = await tx.mapSpotUsage.findUniqueOrThrow({ where: { id: usageId } })
  if (usage.isPublished && !await tx.illustrationPlacement.count({ where: { usageId, x: { not: null }, y: { not: null } } })) {
    await tx.mapSpotUsage.update({ where: { id: usageId }, data: { isPublished: false, version: { increment: 1 } } })
    await tx.spot.update({ where: { id: usage.spotId }, data: { isPublished: false, ...(bumpLegacyVersion ? { liveVersion: { increment: 1 } } : {}) } })
  }
}
