import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { spotRevisionPayloadSchema } from '../shared/schemas/spot-revision'

const mocks = vi.hoisted(() => ({
  spotFindUnique: vi.fn(), membershipFindUnique: vi.fn(), fieldCount: vi.fn(), assetCount: vi.fn(),
  revisionFindFirst: vi.fn(), revisionCreate: vi.fn(), revisionUpdate: vi.fn(), revisionPhotoDeleteMany: vi.fn(), revisionPhotoCreateMany: vi.fn(),
  spotUpdate: vi.fn(), fieldDeleteMany: vi.fn(), fieldCreate: vi.fn(), photoDeleteMany: vi.fn(), photoCreateMany: vi.fn(),
  requireUser: vi.fn(), requireMapAccess: vi.fn(),
  auditCreate: vi.fn(),
}))

const testError = (input: { statusCode: number, statusMessage: string }) => Object.assign(new Error(input.statusMessage), input)

describe('WU-24 Spot Editor revision', () => {
  let saveSpotRevision: typeof import('../server/utils/spot-revision').saveSpotRevision
  let approveSpotRevision: typeof import('../server/utils/spot-revision').approveSpotRevision
  let rejectSpotRevision: typeof import('../server/utils/spot-revision').rejectSpotRevision

  beforeAll(async () => {
    const tx = {
      spotRevision: { findFirst: mocks.revisionFindFirst, create: mocks.revisionCreate, update: mocks.revisionUpdate, updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      spotRevisionPhoto: { deleteMany: mocks.revisionPhotoDeleteMany, createMany: mocks.revisionPhotoCreateMany },
      spot: { update: mocks.spotUpdate },
      spotFieldValue: { deleteMany: mocks.fieldDeleteMany, create: mocks.fieldCreate },
      spotPhoto: { deleteMany: mocks.photoDeleteMany, createMany: mocks.photoCreateMany },
      auditEvent: { create: mocks.auditCreate },
    }
    vi.stubGlobal('createError', testError)
    vi.stubGlobal('requireUser', mocks.requireUser)
    vi.stubGlobal('requireMapAccess', mocks.requireMapAccess)
    vi.stubGlobal('prisma', {
      spot: { findUnique: mocks.spotFindUnique }, tenantMember: { findUnique: mocks.membershipFindUnique },
      spotFieldDefinition: { count: mocks.fieldCount }, mediaAsset: { count: mocks.assetCount },
      $transaction: (callback: (client: typeof tx) => unknown) => callback(tx),
    })
    ;({ saveSpotRevision, approveSpotRevision, rejectSpotRevision } = await import('../server/utils/spot-revision'))
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireUser.mockResolvedValue({ user: { id: 'editor-1', tenantId: 'tenant-a' } })
    mocks.requireMapAccess.mockResolvedValue({ session: { user: { id: 'reviewer-1' } }, map: { id: 'map-a' } })
    mocks.spotFindUnique.mockResolvedValue({
      id: 'spot-1', liveVersion: 3, floor: { map: { id: 'map-a', tenantId: 'tenant-a' } }, editorAssignment: { userId: 'editor-1' },
    })
    mocks.membershipFindUnique.mockResolvedValue({ role: 'MEMBER' })
    mocks.fieldCount.mockResolvedValue(1)
    mocks.assetCount.mockResolvedValue(1)
    mocks.revisionPhotoDeleteMany.mockResolvedValue({ count: 0 })
    mocks.revisionPhotoCreateMany.mockResolvedValue({ count: 1 })
    mocks.fieldDeleteMany.mockResolvedValue({ count: 0 })
    mocks.fieldCreate.mockResolvedValue({})
    mocks.photoDeleteMany.mockResolvedValue({ count: 0 })
    mocks.photoCreateMany.mockResolvedValue({ count: 1 })
    mocks.spotUpdate.mockResolvedValue({})
    mocks.revisionUpdate.mockResolvedValue({ id: 'revision-1', status: 'APPROVED' })
    mocks.auditCreate.mockResolvedValue({})
  })

  afterAll(() => vi.unstubAllGlobals())

  const payload = {
    name: '承認待ち名称', description: '説明', address: '住所', phone: '00-0000', website: 'https://example.com',
    hoursText: '10-17', holidayText: '月曜', fieldValues: [{ fieldDefinitionId: 'field-1', valueJson: '値' }], photoAssetIds: ['asset-1'],
  }

  it('allows only the fixed editable field set', () => {
    expect(spotRevisionPayloadSchema.safeParse(payload).success).toBe(true)
    expect(spotRevisionPayloadSchema.safeParse({ ...payload, categoryIds: ['category-1'] }).success).toBe(false)
    expect(spotRevisionPayloadSchema.safeParse({ ...payload, x: 0.4, isPublished: true }).success).toBe(false)
  })

  it('saves pending data/media references without mutating the live Spot', async () => {
    mocks.revisionFindFirst.mockResolvedValue(null)
    mocks.revisionCreate.mockResolvedValue({ id: 'revision-1', authorId: 'editor-1' })
    await saveSpotRevision({} as never, 'spot-1', payload)
    expect(mocks.revisionCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ baseVersion: 3 }) }))
    expect(mocks.revisionPhotoCreateMany).toHaveBeenCalled()
    expect(mocks.spotUpdate).not.toHaveBeenCalled()
  })

  it('blocks a replacement assignee while the old author revision is pending', async () => {
    mocks.revisionFindFirst.mockResolvedValue({ id: 'revision-old', authorId: 'old-editor' })
    await expect(saveSpotRevision({} as never, 'spot-1', payload)).rejects.toMatchObject({ statusCode: 409 })
    expect(mocks.revisionUpdate).not.toHaveBeenCalled()
  })

  it('detects a stale live version and never overwrites it', async () => {
    mocks.revisionFindFirst.mockResolvedValue({ id: 'revision-1', spotId: 'spot-1', baseVersion: 2, payload, spot: { liveVersion: 3 }, photos: [] })
    await expect(approveSpotRevision({} as never, 'revision-1')).rejects.toMatchObject({ statusCode: 409 })
    expect(mocks.spotUpdate).not.toHaveBeenCalled()
  })

  it('applies only allowed fields, custom values, and ordered photos atomically', async () => {
    mocks.revisionFindFirst.mockResolvedValue({ id: 'revision-1', spotId: 'spot-1', baseVersion: 3, payload, spot: { liveVersion: 3 }, photos: [{ assetId: 'asset-1', order: 0 }] })
    await approveSpotRevision({} as never, 'revision-1')
    const data = mocks.spotUpdate.mock.calls[0]![0].data
    expect(data).toMatchObject({ name: payload.name, liveVersion: { increment: 1 } })
    expect(data).not.toHaveProperty('isPublished')
    expect(data).not.toHaveProperty('x')
    expect(data).not.toHaveProperty('pinIconId')
    expect(mocks.photoCreateMany).toHaveBeenCalledWith({ data: [{ spotId: 'spot-1', assetId: 'asset-1', order: 0 }] })
    expect(mocks.revisionUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'APPROVED', reviewerId: 'reviewer-1' }) }))
    expect(mocks.revisionPhotoDeleteMany).toHaveBeenCalledWith({ where: { revisionId: 'revision-1' } })
  })

  it('removes pending media references after rejection so zero-reference assets can become GC candidates', async () => {
    await rejectSpotRevision({} as never, 'revision-1', '差し戻し')
    expect(mocks.revisionPhotoDeleteMany).toHaveBeenCalledWith({ where: { revisionId: 'revision-1' } })
  })
})
