import { spotRevisionPayloadSchema } from '~~/shared/schemas/spot-revision'

const standardFields = [
  ['name', 'スポット名'],
  ['description', '説明'],
  ['address', '住所'],
  ['phone', '電話番号'],
  ['website', 'Webサイト'],
  ['hoursText', '営業時間'],
  ['holidayText', '定休日'],
] as const

function humanValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '未設定'
  if (typeof value === 'boolean') return value ? 'はい' : 'いいえ'
  if (Array.isArray(value)) return value.map(humanValue).join('、') || '未設定'
  if (typeof value === 'object') return Object.values(value).map(humanValue).join('、') || '未設定'
  return String(value)
}

export default defineEventHandler(async (event) => {
  const { map } = await requireMapAccess(event)
  const [revisions, fields] = await Promise.all([
    prisma.spotRevision.findMany({
      where: { status: 'PENDING', spot: { floor: { mapId: map.id } } },
      include: {
        spot: {
          select: {
            id: true, name: true, description: true, address: true, phone: true, website: true, hoursText: true, holidayText: true, liveVersion: true,
            fieldValues: { select: { fieldDefinitionId: true, valueJson: true } },
            photos: { select: { assetId: true, order: true, asset: { select: { storageKey: true } } }, orderBy: { order: 'asc' } },
          },
        },
        author: { select: { email: true, displayName: true } },
        photos: { select: { assetId: true, order: true, asset: { select: { storageKey: true } } }, orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.spotFieldDefinition.findMany({ where: { mapId: map.id }, select: { id: true, label: true } }),
  ])
  const labelByFieldId = new Map(fields.map(field => [field.id, field.label]))

  return {
    revisions: revisions.map((revision) => {
      const parsed = spotRevisionPayloadSchema.safeParse(revision.payload)
      const changes: Array<{ key: string, label: string, current: string, requested: string }> = []
      if (parsed.success) {
        for (const [key, label] of standardFields) {
          const current = revision.spot[key]
          const requested = parsed.data[key]
          if (JSON.stringify(current) !== JSON.stringify(requested)) changes.push({ key, label, current: humanValue(current), requested: humanValue(requested) })
        }
        const currentValues = new Map(revision.spot.fieldValues.map(value => [value.fieldDefinitionId, value.valueJson]))
        const requestedValues = new Map(parsed.data.fieldValues.map(value => [value.fieldDefinitionId, value.valueJson]))
        for (const fieldId of new Set([...currentValues.keys(), ...requestedValues.keys()])) {
          const current = currentValues.get(fieldId) ?? null
          const requested = requestedValues.get(fieldId) ?? null
          if (JSON.stringify(current) !== JSON.stringify(requested)) changes.push({ key: `field-${fieldId}`, label: labelByFieldId.get(fieldId) ?? 'カスタム項目', current: humanValue(current), requested: humanValue(requested) })
        }
      }
      const currentPhotoIds = revision.spot.photos.map(photo => photo.assetId)
      const requestedPhotoIds = revision.photos.map(photo => photo.assetId)
      const photosChanged = JSON.stringify(currentPhotoIds) !== JSON.stringify(requestedPhotoIds)
      return {
        id: revision.id,
        spotId: revision.spotId,
        authorId: revision.authorId,
        reviewerId: revision.reviewerId,
        status: revision.status,
        payload: revision.payload,
        baseVersion: revision.baseVersion,
        rejectReason: revision.rejectReason,
        reviewedAt: revision.reviewedAt,
        createdAt: revision.createdAt,
        updatedAt: revision.updatedAt,
        author: revision.author,
        photos: revision.photos.map(photo => ({ revisionId: revision.id, assetId: photo.assetId, order: photo.order })),
        spot: { id: revision.spot.id, name: revision.spot.name, liveVersion: revision.spot.liveVersion },
        review: {
          valid: parsed.success,
          stale: revision.spot.liveVersion !== revision.baseVersion,
          changes,
          photos: photosChanged ? {
            current: revision.spot.photos.map(photo => ({ id: photo.assetId, url: `/uploads/${photo.asset.storageKey}` })),
            requested: revision.photos.map(photo => ({ id: photo.assetId, url: `/uploads/${photo.asset.storageKey}` })),
          } : null,
        },
      }
    }),
  }
})
