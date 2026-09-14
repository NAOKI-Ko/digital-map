import { hash } from 'bcryptjs'
import { authLifecycleConfig, createAuthToken, hashAuthToken, normalizeAuthEmail } from './auth-tokens'

const invalidInvite = () => createError({ statusCode: 400, statusMessage: '招待リンクが無効か、有効期限が切れています。' })

export async function issueOrganizationInvitation(input: { tenantId: string, email: string, createdById: string }) {
  const email = normalizeAuthEmail(input.email)
  const { rawToken, tokenHash } = createAuthToken()
  const { invitationTtlMs } = authLifecycleConfig()
  const invitation = await prisma.organizationInvitation.create({
    data: {
      tenantId: input.tenantId,
      email,
      createdById: input.createdById,
      tokenHash,
      expiresAt: new Date(Date.now() + invitationTtlMs),
    },
    select: { id: true, tenantId: true, email: true, status: true, expiresAt: true, createdAt: true },
  })
  return { invitation, rawToken }
}

export async function acceptOrganizationInvitation(input: {
  rawToken: string
  password?: string
  authenticatedUserId?: string
}) {
  const tokenHash = hashAuthToken(input.rawToken)
  return prisma.$transaction(async (tx) => {
    const invitation = await tx.organizationInvitation.findUnique({ where: { tokenHash } })
    if (!invitation || invitation.status !== 'PENDING') throw invalidInvite()
    if (invitation.expiresAt.getTime() <= Date.now()) {
      await tx.organizationInvitation.updateMany({
        where: { id: invitation.id, status: 'PENDING' },
        data: { status: 'EXPIRED' },
      })
      throw invalidInvite()
    }

    const existingUser = await tx.user.findUnique({ where: { email: invitation.email } })
    if (input.authenticatedUserId) {
      const authenticated = await tx.user.findUnique({ where: { id: input.authenticatedUserId } })
      if (!authenticated || normalizeAuthEmail(authenticated.email) !== invitation.email) {
        throw createError({ statusCode: 403, statusMessage: '招待先のメールアドレスとログイン中のユーザーが一致しません。' })
      }
    }
    if (existingUser && input.authenticatedUserId !== existingUser.id) {
      throw createError({ statusCode: 401, statusMessage: '既存アカウントでログインしてから招待を承認してください。' })
    }
    if (!existingUser && !input.password) {
      throw createError({ statusCode: 422, statusMessage: '新規登録にはパスワードが必要です。' })
    }

    const consumed = await tx.organizationInvitation.updateMany({
      where: { id: invitation.id, status: 'PENDING', expiresAt: { gt: new Date() } },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    })
    if (consumed.count !== 1) throw invalidInvite()

    const user = existingUser ?? await tx.user.create({
      data: {
        email: invitation.email,
        passwordHash: await hash(input.password!, 12),
      },
    })
    await tx.tenantMember.upsert({
      where: { tenantId_userId: { tenantId: invitation.tenantId, userId: user.id } },
      create: { tenantId: invitation.tenantId, userId: user.id, role: 'MEMBER' },
      update: {},
    })
    await tx.organizationInvitation.update({
      where: { id: invitation.id },
      data: { acceptedById: user.id },
    })
    return { userId: user.id, tenantId: invitation.tenantId, invitationId: invitation.id }
  }, { isolationLevel: 'Serializable' })
}

export async function issuePasswordReset(emailInput: string) {
  const email = normalizeAuthEmail(emailInput)
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, isActive: true } })
  if (!user?.isActive) return null
  const { rawToken, tokenHash } = createAuthToken()
  const { passwordResetTtlMs } = authLifecycleConfig()
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + passwordResetTtlMs) },
  })
  return { rawToken }
}

export async function consumePasswordReset(rawToken: string, password: string) {
  const tokenHash = hashAuthToken(rawToken)
  return prisma.$transaction(async (tx) => {
    const reset = await tx.passwordResetToken.findUnique({ where: { tokenHash } })
    if (!reset || reset.usedAt || reset.expiresAt.getTime() <= Date.now()) {
      throw createError({ statusCode: 400, statusMessage: '再設定リンクが無効か、有効期限が切れています。' })
    }
    const consumed = await tx.passwordResetToken.updateMany({
      where: { id: reset.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    })
    if (consumed.count !== 1) throw createError({ statusCode: 400, statusMessage: '再設定リンクは既に使用されています。' })
    await tx.user.update({
      where: { id: reset.userId },
      data: { passwordHash: await hash(password, 12), authVersion: { increment: 1 } },
    })
    return { userId: reset.userId }
  }, { isolationLevel: 'Serializable' })
}
