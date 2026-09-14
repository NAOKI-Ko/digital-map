import type { H3Event } from 'h3'
import { Prisma } from '../../prisma/generated/client'
import { spotRevisionPayloadSchema } from '../../shared/schemas/spot-revision'
import { appendAuditEvent } from './audit'

const notFound = () => createError({ statusCode: 404, statusMessage: 'スポットが見つかりません。' })

export async function requireAssignedSpotEditor(event: H3Event, spotId: string) {
  const session = await requireUser(event)
  const spot = await prisma.spot.findUnique({
    where: { id: spotId },
    include: {
      floor: { include: { map: { select: { id: true, tenantId: true } } } }, editorAssignment: true,
      fieldValues: { include: { fieldDefinition: true } },
      photos: { include: { asset: true }, orderBy: { order: 'asc' } },
    },
  })
  if (!spot || spot.editorAssignment?.userId !== session.user.id) throw notFound()
  const membership = await prisma.tenantMember.findUnique({
    where: { tenantId_userId: { tenantId: spot.floor.map.tenantId, userId: session.user.id } },
  })
  if (!membership || session.user.tenantId !== spot.floor.map.tenantId) throw notFound()
  return { session, spot, map: spot.floor.map }
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
    const pending = await tx.spotRevision.findFirst({ where: { spotId, status: 'PENDING' } })
    if (pending && pending.authorId !== session.user.id) {
      throw createError({ statusCode: 409, statusMessage: '前の担当者の承認待ちRevisionを先に承認または却下してください。' })
    }
    const revision = pending
      ? await tx.spotRevision.update({ where: { id: pending.id }, data: { payload: payload as Prisma.InputJsonValue } })
      : await tx.spotRevision.create({ data: { spotId, authorId: session.user.id, baseVersion: spot.liveVersion, payload: payload as Prisma.InputJsonValue } })
    if (!pending) await appendAuditEvent(tx, { tenantId: map.tenantId, actorUserId: session.user.id, action: 'SPOT_REVISION_CREATED', targetType: 'SpotRevision', targetId: revision.id, mapId: map.id, metadata: { spotId } })
    await tx.spotRevisionPhoto.deleteMany({ where: { revisionId: revision.id } })
    if (payload.photoAssetIds.length) {
      await tx.spotRevisionPhoto.createMany({ data: payload.photoAssetIds.map((assetId, order) => ({ revisionId: revision.id, assetId, order })) })
    }
    await appendAuditEvent(tx, { tenantId: map.tenantId, actorUserId: session.user.id, action: 'SPOT_REVISION_SUBMITTED', targetType: 'SpotRevision', targetId: revision.id, mapId: map.id, metadata: { spotId, baseVersion: spot.liveVersion, photoCount: payload.photoAssetIds.length } })
    return revision
  }, { isolationLevel: 'Serializable' })
}

export async function approveSpotRevision(event: H3Event, revisionId: string) {
  const { session, map } = await requireMapAccess(event)
  return prisma.$transaction(async (tx) => {
    const revision = await tx.spotRevision.findFirst({
      where: { id: revisionId, status: 'PENDING', spot: { floor: { mapId: map.id } } },
      include: { spot: true, photos: { orderBy: { order: 'asc' } } },
    })
    if (!revision) throw createError({ statusCode: 404, statusMessage: '承認待ちRevisionが見つかりません。' })
    if (revision.spot.liveVersion !== revision.baseVersion) {
      throw createError({ statusCode: 409, statusMessage: '公開中のSpotが更新されています。Revisionを却下して再作成してください。' })
    }
    const payload = spotRevisionPayloadSchema.parse(revision.payload)
    await tx.spot.update({
      where: { id: revision.spotId },
      data: {
        name: payload.name, description: payload.description, address: payload.address, phone: payload.phone,
        website: payload.website, hoursText: payload.hoursText, holidayText: payload.holidayText,
        liveVersion: { increment: 1 },
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
    return tx.spotRevision.update({
      where: { id: revision.id },
      data: { status: 'APPROVED', reviewerId: session.user.id, reviewedAt: new Date() },
    })
  }, { isolationLevel: 'Serializable' })
}

export async function rejectSpotRevision(event: H3Event, revisionId: string, reason: string) {
  const { session, map } = await requireMapAccess(event)
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.spotRevision.updateMany({ where: { id: revisionId, status: 'PENDING', spot: { floor: { mapId: map.id } } }, data: { status: 'REJECTED', reviewerId: session.user.id, reviewedAt: new Date(), rejectReason: reason } })
    if (result.count === 1) await appendAuditEvent(tx, { tenantId: map.tenantId, actorUserId: session.user.id, action: 'SPOT_REVISION_REJECTED', targetType: 'SpotRevision', targetId: revisionId, mapId: map.id, metadata: { reasonProvided: true } })
    return result
  })
  if (updated.count !== 1) throw createError({ statusCode: 404, statusMessage: '承認待ちRevisionが見つかりません。' })
  return { rejected: true }
}
