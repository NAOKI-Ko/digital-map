import { addOrganizationMemberSchema } from '~~/shared/schemas/organization'

export default defineEventHandler(async (event) => {
  const { tenant } = await requireTenantOwner(event)
  const input = await readValidatedBody(event, addOrganizationMemberSchema.parse)
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
    select: { id: true, email: true, displayName: true },
  })
  if (!user) throw createError({ statusCode: 422, statusMessage: 'このメールアドレスのユーザーはまだ登録されていません。招待機能は今後対応予定です。' })
  const membership = await prisma.tenantMember.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
    create: { tenantId: tenant.id, userId: user.id, role: 'MEMBER' },
    update: {},
  })
  return { membership: { userId: user.id, email: user.email, displayName: user.displayName, role: membership.role } }
})
