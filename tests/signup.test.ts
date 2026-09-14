import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFile } from 'node:fs/promises'
import { signupSchema } from '../shared/schemas/signup'

const mocks = vi.hoisted(() => ({
  intentCreate: vi.fn(), intentFindUnique: vi.fn(), intentUpdate: vi.fn(), userFindUnique: vi.fn(), userCreate: vi.fn(), tenantCreate: vi.fn(), acceptanceCreate: vi.fn(),
}))
const testError = (input: { statusCode: number, statusMessage: string }) => Object.assign(new Error(input.statusMessage), input)

describe('WU-38 self-service onboarding', () => {
  let createSignupIntent: typeof import('../server/utils/signup').createSignupIntent
  let verifySignupToken: typeof import('../server/utils/signup').verifySignupToken
  let completeExistingSignup: typeof import('../server/utils/signup').completeExistingSignup
  let hashAuthToken: typeof import('../server/utils/auth-tokens').hashAuthToken
  const future = new Date(Date.now() + 60_000)

  beforeAll(async () => {
    const tx = { signupIntent: { findUnique: mocks.intentFindUnique, update: mocks.intentUpdate }, user: { findUnique: mocks.userFindUnique, create: mocks.userCreate }, tenant: { create: mocks.tenantCreate }, legalAcceptance: { create: mocks.acceptanceCreate } }
    vi.stubGlobal('createError', testError)
    vi.stubGlobal('useRuntimeConfig', () => ({ auth: { signupVerificationTtlHours: 24 } }))
    vi.stubGlobal('prisma', { signupIntent: { create: mocks.intentCreate, findUnique: mocks.intentFindUnique, update: mocks.intentUpdate }, user: { findUnique: mocks.userFindUnique }, $transaction: (callback: (client: typeof tx) => unknown) => callback(tx) })
    ;({ createSignupIntent, verifySignupToken, completeExistingSignup } = await import('../server/utils/signup'))
    ;({ hashAuthToken } = await import('../server/utils/auth-tokens'))
  })
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.intentCreate.mockImplementation(async ({ data }) => ({ id: 'intent-1', ...data }))
    mocks.intentUpdate.mockResolvedValue({})
    mocks.userCreate.mockResolvedValue({ id: 'user-new' })
    mocks.tenantCreate.mockResolvedValue({ id: 'tenant-new', name: '地域会' })
    mocks.acceptanceCreate.mockResolvedValue({})
  })
  afterAll(() => vi.unstubAllGlobals())

  it('validates email/password/organization and explicit current legal acceptance', () => {
    expect(signupSchema.safeParse({ email: 'new@example.com', password: 'long secure password', organizationName: '地域会', acceptTerms: true, acceptPrivacy: true }).success).toBe(true)
    expect(signupSchema.safeParse({ email: 'new@example.com', password: 'short', organizationName: '地域会', acceptTerms: false, acceptPrivacy: true }).success).toBe(false)
  })

  it('creates only a pending intent with a hash-only 24-hour token before verification', async () => {
    const result = await createSignupIntent({ email: ' NEW@Example.com ', password: 'long secure password', organizationName: ' 地域会 ' })
    const stored = mocks.intentCreate.mock.calls[0]![0].data
    expect(stored.email).toBe('new@example.com')
    expect(stored.verificationTokenHash).toBe(hashAuthToken(result.rawToken))
    expect(JSON.stringify(stored)).not.toContain(result.rawToken)
    expect(stored.termsVersion).toBe('2026-09-14-v1')
    expect(mocks.tenantCreate).not.toHaveBeenCalled()
  })

  it('atomically creates User, Tenant OWNER and legal acceptance only after verification', async () => {
    const intent = { id: 'intent-1', email: 'new@example.com', passwordHash: 'bcrypt', organizationName: '地域会', verificationTokenHash: hashAuthToken('x'.repeat(43)), expiresAt: future, completedAt: null, termsVersion: 'terms-v1', privacyVersion: 'privacy-v1' }
    mocks.intentFindUnique.mockResolvedValue(intent)
    mocks.userFindUnique.mockResolvedValue(null)
    const result = await verifySignupToken('x'.repeat(43))
    expect(result).toMatchObject({ requiresLogin: false, userId: 'user-new', tenantId: 'tenant-new' })
    expect(mocks.tenantCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ members: { create: { userId: 'user-new', role: 'OWNER' } } }) }))
    expect(mocks.acceptanceCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ termsVersion: 'terms-v1', privacyVersion: 'privacy-v1' }) })
    expect(mocks.intentUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ completedAt: expect.any(Date) }) }))
  })

  it('requires login for an existing email without overwriting password or creating a duplicate User', async () => {
    mocks.intentFindUnique.mockResolvedValue({ id: 'intent-existing', email: 'existing@example.com', expiresAt: future, completedAt: null })
    mocks.userFindUnique.mockResolvedValue({ id: 'user-existing', email: 'existing@example.com' })
    expect(await verifySignupToken('y'.repeat(43))).toMatchObject({ requiresLogin: true, intentId: 'intent-existing' })
    expect(mocks.userCreate).not.toHaveBeenCalled()
    expect(mocks.tenantCreate).not.toHaveBeenCalled()
  })

  it('rejects expired, completed, and mismatched-account completion', async () => {
    mocks.intentFindUnique.mockResolvedValue({ id: 'expired', expiresAt: new Date(0), completedAt: null })
    await expect(verifySignupToken('z'.repeat(43))).rejects.toMatchObject({ statusCode: 400 })
    mocks.intentFindUnique.mockResolvedValue({ id: 'intent', email: 'a@example.com', verifiedAt: new Date(), completedAt: null })
    mocks.userFindUnique.mockResolvedValue({ id: 'user-b', email: 'b@example.com' })
    await expect(completeExistingSignup('user-b', 'intent')).rejects.toMatchObject({ statusCode: 400 })
  })

  it('keeps invitations independent and routes completed onboarding to existing Map setup', async () => {
    const [signup, verify, complete, schema] = await Promise.all([
      readFile('server/api/signup/index.post.ts', 'utf8'), readFile('server/api/signup/verify.post.ts', 'utf8'), readFile('server/api/signup/complete-existing.post.ts', 'utf8'), readFile('prisma/schema.prisma', 'utf8'),
    ])
    expect(signup).toContain("configuredRateLimit('signup')")
    expect(verify).toContain('/admin/maps/new?onboarding=1')
    expect(complete).toContain('requireUser(event)')
    expect(schema).toMatch(/invitations\s+OrganizationInvitation\[\]/)
    expect(signup).not.toContain('organizationInvitation')
  })
})
