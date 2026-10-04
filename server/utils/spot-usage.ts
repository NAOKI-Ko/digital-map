import type { Prisma } from '~~/prisma/generated/client'
import { prisma } from './prisma'
import { reconcileUsagePublication } from './illustration-placement'

export const usageAppearanceKeys = ['isPublished', 'importance', 'pinSourceMode', 'pinSourceCategoryId', 'pinIconType', 'pinIconId', 'pinIconImageUrl', 'pinIconAssetId', 'pinColor', 'pinSize'] as const

/** Compatibility boundary for existing Spot mutation contracts. Must run in their transaction. */
export async function synchronizeLegacySpot(tx: Prisma.TransactionClient, spotId: string) {
  const spot = await tx.spot.findUniqueOrThrow({ where: { id: spotId }, include: { floor: true, mapUsage: { include: { placements: true } } } })
  const mapId = spot.mapUsage?.mapId ?? spot.floor?.mapId
  if (!mapId) return // Workspace-owned canonical content without a consumer.
  if (spot.floor && spot.floor.mapId !== mapId) throw new Error('WU72_CONSUMER_TRANSFER_DEFERRED')
  const appearance = Object.fromEntries(usageAppearanceKeys.map(key => [key, spot[key]])) as Pick<typeof spot, typeof usageAppearanceKeys[number]>
  const changed = !spot.mapUsage || usageAppearanceKeys.some(key => spot.mapUsage![key] !== spot[key])
  const usage = spot.mapUsage
    ? changed ? await tx.mapSpotUsage.update({ where: { id: spot.mapUsage.id }, data: { ...appearance, version: { increment: 1 } } }) : spot.mapUsage
    : await tx.mapSpotUsage.create({ data: { id: `usage_${spot.id}`, spotId, mapId, ...appearance } })
  if (!spot.mapUsage) await tx.spot.update({ where: { id: spot.id }, data: { schemaMapId: spot.schemaMapId ?? mapId, stewardMapId: mapId } })
  if (spot.floorId) {
    const primary = spot.mapUsage?.placements.find(item => item.isPrimary)
    if (!primary) await tx.illustrationPlacement.create({ data: { usageId: usage.id, floorId: spot.floorId, x: spot.x, y: spot.y, isPrimary: true } })
    else if (primary.floorId !== spot.floorId || primary.x !== spot.x || primary.y !== spot.y) await tx.illustrationPlacement.update({ where: { id: primary.id }, data: { floorId: spot.floorId, x: spot.x, y: spot.y, version: { increment: 1 } } })
  }
  await reconcileUsagePublication(tx, usage.id, false)
}

export async function updateSpotWithUsage<T extends Prisma.SpotUpdateArgs>(tx: Prisma.TransactionClient, args: Prisma.SelectSubset<T, Prisma.SpotUpdateArgs>) {
  // Keep the legacy optimistic token, response shape and canonical ID during the transition.
  const contentKeys = ['name', 'description', 'address', 'website', 'hoursText', 'holidayText', 'phone', 'lat', 'lng', 'photosJson', 'spotCategories']
  const contentChanged = contentKeys.some(key => key in args.data)
  if (contentChanged) Object.assign(args.data, { contentVersion: { increment: 1 } })
  const result = await tx.spot.update<T>(args)
  await synchronizeLegacySpot(tx, args.where.id!)
  return result
}

export async function createSpotWithUsage<T extends Prisma.SpotCreateArgs>(tx: Prisma.TransactionClient, args: Prisma.SelectSubset<T, Prisma.SpotCreateArgs>) {
  const result = await tx.spot.create(args)
  // Existing creation contracts always return the canonical ID.
  await synchronizeLegacySpot(tx, (result as { id: string }).id)
  return result
}

export function updateLegacySpot<T extends Prisma.SpotUpdateArgs>(args: Prisma.SelectSubset<T, Prisma.SpotUpdateArgs>) {
  return prisma.$transaction(tx => updateSpotWithUsage(tx, args), { isolationLevel: 'Serializable' })
}

/** Remove this Map's adoption; canonical content and schema provenance survive. */
export async function detachSpotUsage(tx: Prisma.TransactionClient, spotId: string, mapId: string, expectedVersion: number) {
  const changed = await tx.spot.updateMany({ where: { id: spotId, liveVersion: expectedVersion, mapUsage: { mapId } }, data: { stewardMapId: null, floorId: null, x: null, y: null, isPublished: false, liveVersion: { increment: 1 } } })
  if (changed.count !== 1) throw createError({ statusCode: 409, statusMessage: 'スポットが更新されています。再読込してください。' })
  await tx.mapSpotUsage.delete({ where: { spotId } })
}
