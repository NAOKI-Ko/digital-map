import type { H3Event } from 'h3'

const forbidden = () => createError({ statusCode: 403, statusMessage: 'この操作を行う権限がありません。' })

export async function requireUser(event: H3Event) {
  const session = await requireUserSession(event)
  if (!session.user?.id) throw forbidden()
  return session
}

export async function requireTenantMember(event: H3Event, tenantId?: string) {
  const session = await requireUser(event)
  const resolvedTenantId = tenantId ?? session.user.tenantId
  if (!resolvedTenantId) throw forbidden()
  const membership = await prisma.tenantMember.findUnique({
    where: { tenantId_userId: { tenantId: resolvedTenantId, userId: session.user.id } },
    include: { tenant: true },
  })
  if (!membership) throw forbidden()
  return { session, membership, tenant: membership.tenant }
}

export async function requireTenantOwner(event: H3Event, tenantId?: string) {
  const context = await requireTenantMember(event, tenantId)
  if (context.membership.role !== 'OWNER') throw forbidden()
  return context
}

export async function buildSessionUser(userId: string, tenantId?: string) {
  const memberships = await prisma.tenantMember.findMany({
    where: { userId },
    include: { tenant: true, user: { select: { email: true, displayName: true } } },
    orderBy: [{ createdAt: 'asc' }, { tenantId: 'asc' }],
  })
  const active = memberships.find(item => item.tenantId === tenantId) ?? memberships[0]
  if (!active) return null
  return {
    id: userId,
    tenantId: active.tenantId,
    email: active.user.email,
    displayName: active.user.displayName,
    tenantRole: active.role,
    tenantName: active.tenant.name,
    organizations: memberships.map(item => ({
      id: item.tenantId,
      name: item.tenant.name,
      role: item.role,
    })),
  }
}

export async function requireTenantMediaAccess(event: H3Event) {
  const context = await requireTenantMember(event)
  if (context.membership.role === 'OWNER') return context
  const assignment = await prisma.mapMember.findFirst({
    where: { userId: context.session.user.id, map: { tenantId: context.tenant.id } },
    select: { id: true },
  })
  if (!assignment) throw forbidden()
  return context
}

// Compatibility alias. Authorization is resolved from current DB memberships.
export const requireAdminSession = requireUser
