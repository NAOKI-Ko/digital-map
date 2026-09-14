import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  invitationCreate: vi.fn(), invitationFindUnique: vi.fn(), invitationUpdateMany: vi.fn(), invitationUpdate: vi.fn(),
  userFindUnique: vi.fn(), userCreate: vi.fn(), userUpdate: vi.fn(), memberUpsert: vi.fn(),
  resetCreate: vi.fn(), resetFindUnique: vi.fn(), resetUpdateMany: vi.fn(),
}))

const testError = (input: { statusCode: number, statusMessage: string }) => Object.assign(new Error(input.statusMessage), input)

describe('WU-23 auth lifecycle', () => {
  let hashAuthToken: typeof import('../server/utils/auth-tokens').hashAuthToken
  let createAuthToken: typeof import('../server/utils/auth-tokens').createAuthToken
  let issueOrganizationInvitation: typeof import('../server/utils/auth-lifecycle').issueOrganizationInvitation
  let acceptOrganizationInvitation: typeof import('../server/utils/auth-lifecycle').acceptOrganizationInvitation
  let consumePasswordReset: typeof import('../server/utils/auth-lifecycle').consumePasswordReset

  beforeAll(async () => {
    const tx = {
      organizationInvitation: { findUnique: mocks.invitationFindUnique, updateMany: mocks.invitationUpdateMany, update: mocks.invitationUpdate },
      user: { findUnique: mocks.userFindUnique, create: mocks.userCreate, update: mocks.userUpdate },
      tenantMember: { upsert: mocks.memberUpsert },
      passwordResetToken: { findUnique: mocks.resetFindUnique, updateMany: mocks.resetUpdateMany },
    }
    vi.stubGlobal('createError', testError)
    vi.stubGlobal('useRuntimeConfig', () => ({ auth: { invitationTtlHours: 72, passwordResetTtlMinutes: 60 } }))
    vi.stubGlobal('prisma', {
      organizationInvitation: { create: mocks.invitationCreate },
      passwordResetToken: { create: mocks.resetCreate },
      user: { findUnique: mocks.userFindUnique },
      $transaction: (callback: (client: typeof tx) => unknown) => callback(tx),
    })
    ;({ hashAuthToken, createAuthToken } = await import('../server/utils/auth-tokens'))
    ;({ issueOrganizationInvitation, acceptOrganizationInvitation, consumePasswordReset } = await import('../server/utils/auth-lifecycle'))
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.invitationUpdateMany.mockResolvedValue({ count: 1 })
    mocks.invitationUpdate.mockResolvedValue({})
    mocks.userCreate.mockResolvedValue({ id: 'new-user', email: 'new@example.com' })
    mocks.memberUpsert.mockResolvedValue({})
    mocks.resetUpdateMany.mockResolvedValue({ count: 1 })
    mocks.userUpdate.mockResolvedValue({})
  })

  afterAll(() => vi.unstubAllGlobals())

  it('creates an unpredictable raw token and persists only its SHA-256 hash', async () => {
    const first = createAuthToken()
    const second = createAuthToken()
    expect(first.rawToken).not.toBe(second.rawToken)
    expect(first.tokenHash).toBe(hashAuthToken(first.rawToken))
    expect(first.tokenHash).not.toContain(first.rawToken)

    mocks.invitationCreate.mockImplementation(async ({ data, select }) => ({ id: 'invite-1', ...data, select }))
    const issued = await issueOrganizationInvitation({ tenantId: 'tenant-a', email: ' NEW@Example.COM ', createdById: 'owner-1' })
    const persisted = mocks.invitationCreate.mock.calls[0]![0].data
    expect(persisted.email).toBe('new@example.com')
    expect(persisted.tokenHash).toBe(hashAuthToken(issued.rawToken))
    expect(JSON.stringify(persisted)).not.toContain(issued.rawToken)
  })

  it('atomically creates a new MEMBER in the invitation tenant and consumes once', async () => {
    mocks.invitationFindUnique.mockResolvedValue({
      id: 'invite-1', tenantId: 'tenant-from-record', email: 'new@example.com', status: 'PENDING', expiresAt: new Date(Date.now() + 60_000),
    })
    mocks.userFindUnique.mockResolvedValue(null)
    const accepted = await acceptOrganizationInvitation({ rawToken: 'x'.repeat(43), password: 'correct horse battery staple' })
    expect(accepted.tenantId).toBe('tenant-from-record')
    expect(mocks.memberUpsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ tenantId: 'tenant-from-record', role: 'MEMBER' }),
    }))
    mocks.invitationFindUnique.mockResolvedValue({ id: 'invite-1', status: 'ACCEPTED', expiresAt: new Date(Date.now() + 60_000) })
    await expect(acceptOrganizationInvitation({ rawToken: 'x'.repeat(43), password: 'another safe password' })).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects an authenticated account whose normalized email differs', async () => {
    mocks.invitationFindUnique.mockResolvedValue({
      id: 'invite-1', tenantId: 'tenant-a', email: 'invitee@example.com', status: 'PENDING', expiresAt: new Date(Date.now() + 60_000),
    })
    mocks.userFindUnique.mockResolvedValueOnce({ id: 'invitee', email: 'invitee@example.com' }).mockResolvedValueOnce({ id: 'wrong', email: 'wrong@example.com' })
    await expect(acceptOrganizationInvitation({ rawToken: 'y'.repeat(43), authenticatedUserId: 'wrong' })).rejects.toMatchObject({ statusCode: 403 })
    expect(mocks.memberUpsert).not.toHaveBeenCalled()
  })

  it('password reset is single-use and increments the authoritative session version', async () => {
    mocks.resetFindUnique.mockResolvedValue({ id: 'reset-1', userId: 'user-1', usedAt: null, expiresAt: new Date(Date.now() + 60_000) })
    await consumePasswordReset('z'.repeat(43), 'correct horse battery staple')
    expect(mocks.resetUpdateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ usedAt: null }) }))
    expect(mocks.userUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ authVersion: { increment: 1 } }) }))
    mocks.resetFindUnique.mockResolvedValue({ id: 'reset-1', userId: 'user-1', usedAt: new Date(), expiresAt: new Date(Date.now() + 60_000) })
    await expect(consumePasswordReset('z'.repeat(43), 'correct horse battery staple')).rejects.toMatchObject({ statusCode: 400 })
  })
})
