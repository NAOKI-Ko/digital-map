import type { H3Event } from 'h3'
import { Prisma } from '../../prisma/generated/client'
import { spotRevisionPayloadSchema } from '../../shared/schemas/spot-revision'
import { appendAuditEvent } from './audit'
import { validateCustomFieldValue } from '~~/shared/schemas/spot-field'

type ReviewAccess = { session: Awaited<ReturnType<typeof requireUser>>, map: { id: string, tenantId: string }, isOwner: boolean, canonicalSpotId?: string }

async function validateRevisionResources(tx: Prisma.TransactionClient, payload: ReturnType<typeof spotRevisionPayloadSchema.parse>, mapId: string, tenantId: string) {
  const ids = payload.fieldValues.map(value => value.fieldDefinitionId)
  const fields = await tx.spotFieldDefinition.findMany({ where: { id: { in: ids }, mapId, enabled: true } })
  if (new Set(ids).size !== ids.length || fields.length !== ids.length || payload.fieldValues.some(value => { const field = fields.find(item => item.id === value.fieldDefinitionId); return !field || !validateCustomFieldValue(field.type, value.valueJson) })) throw createError({ statusCode: 422, statusMessage: 'Revisionの項目定義を確認してください。' })
  if (await tx.mediaAsset.count({ where: { id: { in: payload.photoAssetIds }, tenantId } }) !== payload.photoAssetIds.length) throw createError({ statusCode: 422, statusMessage: 'Revisionの写真を確認してください。' })
}


const notFound = () => createError({ statusCode: 404, statusMessage: 'スポットが見つかりません。' })

export async function requireAssignedSpotEditor(event: H3Event, spotId: string) {
  const session = await requireUser(event)
  const spot = await prisma.spot.findUnique({
    where: { id: spotId, tenantId: session.user.tenantId },
    include: {
      mapUsage: { include: { map: { select: { id: true, tenantId: true, archivedAt: true } } } }, editorAssignment: true,
      fieldValues: { include: { fieldDefinition: true } },
      photos: { include: { asset: true }, orderBy: { order: 'asc' } },
    },
  })
  if (!spot || !spot.mapUsage || spot.mapUsage.map.archivedAt || spot.stewardMapId !== spot.mapUsage.mapId || spot.tenantId !== spot.mapUsage.map.tenantId || spot.editorAssignment?.userId !== session.user.id) throw notFound()
  const membership = await prisma.tenantMember.findUnique({
    where: { tenantId_userId: { tenantId: spot.mapUsage.map.tenantId, userId: session.user.id } },
  })
  if (!membership || session.user.tenantId !== spot.mapUsage.map.tenantId) throw notFound()
  return { session, spot, map: spot.mapUsage.map }
}

export async function saveSpotRevision(event: H3Event, spotId: string, input: unknown) {
  const { session, spot, map } = await requireAssignedSpotEditor(event, spotId)
  const payload = spotRevisionPayloadSchema.parse(input)
  const fieldIds = payload.fieldValues.map(value => value.fieldDefinitionId)
  const [validFieldCount, validAssetCount] = await Promise.all([
    prisma.spotFieldDefinition.count({ where: { id: { in: fieldIds }, mapId: map.id, enabled: true } }),
    prisma.mediaAsset.count({ where: { id: { in: payload.photoAssetIds }, tenantId: map.tenantId } }),
  ])
  if (validFieldCount !== new Set(fieldIds).size || validAssetCount !== payload.photoAssetIds.length) {
    throw createError({ statusCode: 422, statusMessage: '編集対象に無効な項目または画像が含まれています。' })
  }
  return prisma.$transaction(async (tx) => {
    await validateRevisionResources(tx, payload, map.id, map.tenantId)
    const pending = await tx.spotRevision.findFirst({ where: { spotId, status: 'PENDING' } })
    if (pending && pending.authorId !== session.user.id) {
      throw createError({ statusCode: 409, statusMessage: '前の担当者の承認待ちRevisionを先に承認または却下してください。' })
    }
    const revision = pending
      ? await tx.spotRevision.update({ where: { id: pending.id }, data: { payload: payload as Prisma.InputJsonValue } })
      : await tx.spotRevision.create({ data: { spotId, authorId: session.user.id, baseVersion: spot.contentVersion, payload: payload as Prisma.InputJsonValue } })
    if (!pending) await appendAuditEvent(tx, { tenantId: map.tenantId, actorUserId: session.user.id, action: 'SPOT_REVISION_CREATED', targetType: 'SpotRevision', targetId: revision.id, mapId: map.id, metadata: { spotId } })
    await tx.spotRevisionPhoto.deleteMany({ where: { revisionId: revision.id } })
    if (payload.photoAssetIds.length) {
      await tx.spotRevisionPhoto.createMany({ data: payload.photoAssetIds.map((assetId, order) => ({ revisionId: revision.id, assetId, order })) })
    }
    await appendAuditEvent(tx, { tenantId: map.tenantId, actorUserId: session.user.id, action: 'SPOT_REVISION_SUBMITTED', targetType: 'SpotRevision', targetId: revision.id, mapId: map.id, metadata: { spotId, baseVersion: spot.contentVersion, photoCount: payload.photoAssetIds.length } })
    return revision
  }, { isolationLevel: 'Serializable' })
}

export async function approveSpotRevision(event: H3Event, revisionId: string, ownerAccess?: ReviewAccess) {
  const { session, map, isOwner, canonicalSpotId } = ownerAccess ?? await requireMapAccess(event) as ReviewAccess
  return prisma.$transaction(async (tx) => {
    const revision = await tx.spotRevision.findFirst({
      where: { id: revisionId, status: 'PENDING', spot: { tenantId: map.tenantId, ...(canonicalSpotId ? { id: canonicalSpotId, schemaMapId: map.id } : { mapUsage: { mapId: map.id }, ...(isOwner ? {} : { stewardMapId: map.id }) }) } },
      include: { spot: true, photos: { orderBy: { order: 'asc' } } },
    })
    if (!revision) throw createError({ statusCode: 404, statusMessage: '承認待ちRevisionが見つかりません。' })
    if (revision.spot.contentVersion !== revision.baseVersion) {
      throw createError({ statusCode: 409, statusMessage: '公開中のSpotが更新されています。Revisionを却下して再作成してください。' })
    }
    const payload = spotRevisionPayloadSchema.parse(revision.payload)
    await validateRevisionResources(tx, payload, revision.spot.schemaMapId ?? map.id, map.tenantId)
    await tx.spot.update({
      where: { id: revision.spotId },
      data: {
        name: payload.name, description: payload.description, address: payload.address, phone: payload.phone,
        website: payload.website, hoursText: payload.hoursText, holidayText: payload.holidayText,
        liveVersion: { increment: 1 }, contentVersion: { increment: 1 },
      },
    })
    await tx.spotFieldValue.deleteMany({ where: { spotId: revision.spotId, fieldDefinitionId: { in: payload.fieldValues.map(value => value.fieldDefinitionId) } } })
    for (const value of payload.fieldValues) {
      await tx.spotFieldValue.create({ data: { spotId: revision.spotId, fieldDefinitionId: value.fieldDefinitionId, valueJson: value.valueJson as Prisma.InputJsonValue } })
    }
    await tx.spotPhoto.deleteMany({ where: { spotId: revision.spotId } })
    if (revision.photos.length) {
      await tx.spotPhoto.createMany({ data: revision.photos.map(photo => ({ spotId: revision.spotId, assetId: photo.assetId, order: photo.order })) })
    }
    await appendAuditEvent(tx, { tenantId: map.tenantId, actorUserId: session.user.id, action: 'SPOT_REVISION_APPROVED', targetType: 'SpotRevision', targetId: revision.id, mapId: map.id, metadata: { spotId: revision.spotId, baseVersion: revision.baseVersion, photoCount: revision.photos.length } })
    const approved = await tx.spotRevision.update({
      where: { id: revision.id },
      data: { status: 'APPROVED', reviewerId: session.user.id, reviewedAt: new Date() },
    })
    await tx.spotRevisionPhoto.deleteMany({ where: { revisionId: revision.id } })
    return approved
  }, { isolationLevel: 'Serializable' })
}

export async function rejectSpotRevision(event: H3Event, revisionId: string, reason: string, ownerAccess?: ReviewAccess) {
  const { session, map, isOwner, canonicalSpotId } = ownerAccess ?? await requireMapAccess(event) as ReviewAccess
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.spotRevision.updateMany({ where: { id: revisionId, status: 'PENDING', spot: { tenantId: map.tenantId, ...(canonicalSpotId ? { id: canonicalSpotId, schemaMapId: map.id } : { mapUsage: { mapId: map.id }, ...(isOwner ? {} : { stewardMapId: map.id }) }) } }, data: { status: 'REJECTED', reviewerId: session.user.id, reviewedAt: new Date(), rejectReason: reason } })
    if (result.count === 1) {
      await tx.spotRevisionPhoto.deleteMany({ where: { revisionId } })
      await appendAuditEvent(tx, { tenantId: map.tenantId, actorUserId: session.user.id, action: 'SPOT_REVISION_REJECTED', targetType: 'SpotRevision', targetId: revisionId, mapId: map.id, metadata: { reasonProvided: true } })
    }
    return result
  })
  if (updated.count !== 1) throw createError({ statusCode: 404, statusMessage: '承認待ちRevisionが見つかりません。' })
  return { rejected: true }
}
