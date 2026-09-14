import { randomBytes } from 'node:crypto'
import { hash } from 'bcryptjs'
import { PRIVACY_VERSION, TERMS_VERSION } from '../../content/legal/config'
import { createAuthToken, hashAuthToken, normalizeAuthEmail } from './auth-tokens'

export function signupConfig() {
  return { verificationTtlMs: Number(useRuntimeConfig().auth.signupVerificationTtlHours) * 60 * 60 * 1000 }
}

export function organizationSlug(name: string) {
  const prefix = name.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'organization'
  return `${prefix}-${randomBytes(5).toString('hex')}`
}

export async function createSignupIntent(input: { email: string, password: string, organizationName: string }) {
  const { rawToken, tokenHash } = createAuthToken()
  const intent = await prisma.signupIntent.create({ data: { email: normalizeAuthEmail(input.email), passwordHash: await hash(input.password, 12), organizationName: input.organizationName.trim(), verificationTokenHash: tokenHash, expiresAt: new Date(Date.now() + signupConfig().verificationTtlMs), termsVersion: TERMS_VERSION, privacyVersion: PRIVACY_VERSION } })
  return { intent, rawToken }
}

export async function verifySignupToken(rawToken: string) {
  const intent = await prisma.signupIntent.findUnique({ where: { verificationTokenHash: hashAuthToken(rawToken) } })
  if (!intent || intent.verifiedAt || intent.completedAt || intent.expiresAt <= new Date()) throw createError({ statusCode: 400, statusMessage: '確認リンクが無効または期限切れです。' })
  const existing = await prisma.user.findUnique({ where: { email: intent.email } })
  if (existing) {
    await prisma.signupIntent.update({ where: { id: intent.id }, data: { verifiedAt: new Date(), createdUserId: existing.id } })
    return { requiresLogin: true, intentId: intent.id, userId: existing.id, tenantId: null }
  }
  const result = await prisma.$transaction(async (transaction) => {
    const fresh = await transaction.signupIntent.findUnique({ where: { id: intent.id } })
    if (!fresh || fresh.verifiedAt || fresh.completedAt || fresh.expiresAt <= new Date()) throw createError({ statusCode: 400, statusMessage: '確認リンクが無効または期限切れです。' })
    const user = await transaction.user.create({ data: { email: fresh.email, passwordHash: fresh.passwordHash, emailVerifiedAt: new Date() } })
    const tenant = await transaction.tenant.create({ data: { name: fresh.organizationName, slug: organizationSlug(fresh.organizationName), members: { create: { userId: user.id, role: 'OWNER' } } } })
    await transaction.legalAcceptance.create({ data: { userId: user.id, tenantId: tenant.id, termsVersion: fresh.termsVersion, privacyVersion: fresh.privacyVersion } })
    await transaction.signupIntent.update({ where: { id: fresh.id }, data: { verifiedAt: new Date(), completedAt: new Date(), createdUserId: user.id } })
    return { userId: user.id, tenantId: tenant.id }
  })
  return { requiresLogin: false, intentId: intent.id, ...result }
}

export async function completeExistingSignup(userId: string, intentId: string) {
  return prisma.$transaction(async (transaction) => {
    const [intent, user] = await Promise.all([transaction.signupIntent.findUnique({ where: { id: intentId } }), transaction.user.findUnique({ where: { id: userId } })])
    if (!intent?.verifiedAt || intent.completedAt || !user || intent.email !== user.email) throw createError({ statusCode: 400, statusMessage: '確認済みの登録手続きが見つかりません。' })
    const tenant = await transaction.tenant.create({ data: { name: intent.organizationName, slug: organizationSlug(intent.organizationName), members: { create: { userId, role: 'OWNER' } } } })
    await transaction.legalAcceptance.create({ data: { userId, tenantId: tenant.id, termsVersion: intent.termsVersion, privacyVersion: intent.privacyVersion } })
    await transaction.signupIntent.update({ where: { id: intent.id }, data: { completedAt: new Date(), createdUserId: userId } })
    return tenant
  })
}
