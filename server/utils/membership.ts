import { appendAuditEvent } from './audit'

export async function changeTenantMemberRole(tenantId: string, userId: string, role: 'OWNER' | 'MEMBER', actorUserId?: string) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.tenantMember.findUnique({ where: { tenantId_userId: { tenantId, userId } } })
    if (!current) throw createError({ statusCode: 404, statusMessage: '組織メンバーが見つかりません。' })
    if (current.role === 'OWNER' && role === 'MEMBER') {
      const ownerCount = await tx.tenantMember.count({ where: { tenantId, role: 'OWNER' } })
      if (ownerCount <= 1) throw createError({ statusCode: 409, statusMessage: '組織には最低1名のオーナーが必要です。最後のオーナーは降格できません。' })
    }
    const updated = await tx.tenantMember.update({ where: { id: current.id }, data: { role } })
    if (current.role !== role) {
      await tx.user.update({ where: { id: userId }, data: { authVersion: { increment: 1 } } })
      await appendAuditEvent(tx, { tenantId, actorUserId, action: 'TENANT_MEMBER_ROLE_CHANGED', targetType: 'TenantMember', targetId: current.id, metadata: { userId, oldRole: current.role, newRole: role } })
    }
    return updated
  }, { isolationLevel: 'Serializable' })
}

export async function removeTenantMember(tenantId: string, userId: string, actorUserId?: string) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.tenantMember.findUnique({ where: { tenantId_userId: { tenantId, userId } } })
    if (!current) throw createError({ statusCode: 404, statusMessage: '組織メンバーが見つかりません。' })
    if (current.role === 'OWNER') {
      const ownerCount = await tx.tenantMember.count({ where: { tenantId, role: 'OWNER' } })
      if (ownerCount <= 1) throw createError({ statusCode: 409, statusMessage: '組織には最低1名のオーナーが必要です。最後のオーナーは削除できません。' })
    }
    await tx.mapMember.deleteMany({ where: { userId, map: { tenantId } } })
    await tx.tenantMember.delete({ where: { id: current.id } })
    await tx.user.update({ where: { id: userId }, data: { authVersion: { increment: 1 } } })
    await appendAuditEvent(tx, { tenantId, actorUserId, action: 'TENANT_MEMBER_REMOVED', targetType: 'TenantMember', targetId: current.id, metadata: { userId, oldRole: current.role } })
    return { removedUserId: userId }
  }, { isolationLevel: 'Serializable' })
}

export async function setUserActive(userId: string, isActive: boolean) {
  return prisma.user.update({
    where: { id: userId },
    data: { isActive, authVersion: { increment: 1 } },
  })
}

export async function assignMapEditor(mapId: string, tenantId: string, userId: string, actorUserId?: string) {
  const member = await prisma.tenantMember.findUnique({ where: { tenantId_userId: { tenantId, userId } } })
  if (!member) throw createError({ statusCode: 422, statusMessage: '同じ組織のメンバーだけを編集者に追加できます。' })
  return prisma.$transaction(async (tx) => {
    const assignment = await tx.mapMember.upsert({
      where: { mapId_userId: { mapId, userId } }, create: { mapId, userId, role: 'EDITOR' }, update: {},
    })
    await appendAuditEvent(tx, { tenantId, actorUserId, action: 'MAP_EDITOR_ASSIGNED', targetType: 'MapMember', targetId: assignment.id, mapId, metadata: { userId } })
    return assignment
  })
}
