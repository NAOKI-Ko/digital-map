import type { H3Event } from 'h3'
import { z } from 'zod'
import type { Prisma } from '~~/prisma/generated/client'
import { appendAuditEvent } from './audit'
import { validateSpotFieldSubmission } from './spot-field'
import { spotFormSchema } from '~~/shared/schemas/spot'

export async function requireWorkspaceSpot(event: H3Event) {
  const { session } = await requireTenantOwner(event)
  const spot = await prisma.spot.findFirst({ where: { id: getRouterParam(event, 'spotId'), tenantId: session.user.tenantId }, include: { mapUsage: true } })
  if (!spot) throw createError({ statusCode: 404, statusMessage: 'スポットが見つかりません。' })
  return { session, spot }
}

export const workspaceContentInput = z.object({
  expectedContentVersion: z.number().int().positive(),
  name: spotFormSchema.shape.name,
  description: spotFormSchema.shape.description.nullable(), address: spotFormSchema.shape.address.nullable(),
  phone: spotFormSchema.shape.phone.nullable(), website: spotFormSchema.shape.website.nullable(),
  hoursText: spotFormSchema.shape.hoursText.nullable(), holidayText: spotFormSchema.shape.holidayText.nullable(),
  customValues: z.record(z.string(), z.union([z.string(), z.number().finite(), z.boolean(), z.null()])).default({}),
}).strict()

export async function updateWorkspaceContent(tx: Prisma.TransactionClient, context: Awaited<ReturnType<typeof requireWorkspaceSpot>>, input: z.infer<typeof workspaceContentInput>) {
  const { expectedContentVersion, customValues, ...content } = input
  const { spot, session } = context
  if (spot.schemaMapId) await validateSpotFieldSubmission(tx, spot.schemaMapId, content, customValues, spot.id)
  else if (Object.keys(customValues).length) throw createError({ statusCode: 422, statusMessage: '項目の定義を確認してください。' })
  const updated = await tx.spot.update({ where: { id: spot.id, tenantId: session.user.tenantId, contentVersion: expectedContentVersion }, data: { ...content, contentVersion: { increment: 1 }, liveVersion: { increment: 1 } } })
  for (const [fieldDefinitionId, valueJson] of Object.entries(customValues)) {
    if (valueJson === null || valueJson === '') await tx.spotFieldValue.deleteMany({ where: { spotId: spot.id, fieldDefinitionId } })
    else await tx.spotFieldValue.upsert({ where: { spotId_fieldDefinitionId: { spotId: spot.id, fieldDefinitionId } }, create: { spotId: spot.id, fieldDefinitionId, valueJson }, update: { valueJson } })
  }
  await appendAuditEvent(tx, { tenantId: spot.tenantId, actorUserId: session.user.id, action: 'SPOT_CANONICAL_UPDATED', targetType: 'Spot', targetId: spot.id, mapId: spot.schemaMapId, metadata: { contentVersion: updated.contentVersion } })
  return updated
}
