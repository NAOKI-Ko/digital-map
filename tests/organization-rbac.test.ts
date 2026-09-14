import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  memberFindUnique: vi.fn(), memberFindMany: vi.fn(), memberCount: vi.fn(), memberUpdate: vi.fn(), memberDelete: vi.fn(),
  mapMemberFindUnique: vi.fn(), mapMemberFindFirst: vi.fn(), mapMemberUpsert: vi.fn(), mapMemberDeleteMany: vi.fn(),
  userFindUnique: vi.fn(), userUpdate: vi.fn(),
  requireUserSession: vi.fn(),
  clearUserSession: vi.fn(),
}))

function testError(input: { statusCode: number, statusMessage: string }) {
  return Object.assign(new Error(input.statusMessage), input)
}

describe('KAN-52 organization / map RBAC', () => {
  let changeTenantMemberRole: typeof import('../server/utils/membership').changeTenantMemberRole
  let removeTenantMember: typeof import('../server/utils/membership').removeTenantMember
  let assignMapEditor: typeof import('../server/utils/membership').assignMapEditor
  let buildSessionUser: typeof import('../server/utils/session').buildSessionUser
  let requireTenantOwner: typeof import('../server/utils/session').requireTenantOwner
  let requireTenantMediaAccess: typeof import('../server/utils/session').requireTenantMediaAccess

  beforeAll(async () => {
    const tx = {
      tenantMember: { findUnique: mocks.memberFindUnique, count: mocks.memberCount, update: mocks.memberUpdate, delete: mocks.memberDelete },
      mapMember: { deleteMany: mocks.mapMemberDeleteMany },
      user: { update: mocks.userUpdate },
    }
    vi.stubGlobal('createError', testError)
    vi.stubGlobal('requireUserSession', mocks.requireUserSession)
    vi.stubGlobal('clearUserSession', mocks.clearUserSession)
    vi.stubGlobal('prisma', {
      $transaction: (callback: (client: typeof tx) => unknown) => callback(tx),
      tenantMember: { findUnique: mocks.memberFindUnique, findMany: mocks.memberFindMany },
      mapMember: { findUnique: mocks.mapMemberFindUnique, findFirst: mocks.mapMemberFindFirst, upsert: mocks.mapMemberUpsert, deleteMany: mocks.mapMemberDeleteMany },
      user: { findUnique: mocks.userFindUnique, update: mocks.userUpdate },
    })
    ;({ changeTenantMemberRole, removeTenantMember, assignMapEditor } = await import('../server/utils/membership'))
    ;({ buildSessionUser, requireTenantOwner, requireTenantMediaAccess } = await import('../server/utils/session'))
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.memberFindUnique.mockResolvedValue({ id: 'tm-1', tenantId: 'tenant-a', userId: 'user-a', role: 'MEMBER', tenant: { id: 'tenant-a' } })
    mocks.memberCount.mockResolvedValue(2)
    mocks.memberUpdate.mockResolvedValue({ id: 'tm-1', role: 'OWNER' })
    mocks.memberDelete.mockResolvedValue({})
    mocks.mapMemberDeleteMany.mockResolvedValue({ count: 1 })
    mocks.mapMemberUpsert.mockResolvedValue({ id: 'mm-1', role: 'EDITOR' })
    mocks.mapMemberFindFirst.mockResolvedValue({ id: 'mm-1' })
    mocks.userFindUnique.mockResolvedValue({ isActive: true, authVersion: 1 })
    mocks.userUpdate.mockResolvedValue({})
    mocks.requireUserSession.mockResolvedValue({ user: { id: 'user-a', tenantId: 'tenant-a', authVersion: 1 } })
  })

  afterAll(() => vi.unstubAllGlobals())

  it('MEMBERをOWNERへ昇格できる', async () => {
    await expect(changeTenantMemberRole('tenant-a', 'user-a', 'OWNER')).resolves.toMatchObject({ role: 'OWNER' })
    expect(mocks.memberUpdate).toHaveBeenCalledWith({ where: { id: 'tm-1' }, data: { role: 'OWNER' } })
  })

  it('複数Ownerなら降格でき、最後のOwnerは降格できない', async () => {
    mocks.memberFindUnique.mockResolvedValue({ id: 'tm-owner', role: 'OWNER' })
    mocks.memberUpdate.mockResolvedValue({ id: 'tm-owner', role: 'MEMBER' })
    await expect(changeTenantMemberRole('tenant-a', 'owner-a', 'MEMBER')).resolves.toMatchObject({ role: 'MEMBER' })
    mocks.memberCount.mockResolvedValue(1)
    await expect(changeTenantMemberRole('tenant-a', 'owner-a', 'MEMBER')).rejects.toMatchObject({ statusCode: 409 })
  })

  it('最後のOwnerを組織から削除できない', async () => {
    mocks.memberFindUnique.mockResolvedValue({ id: 'tm-owner', role: 'OWNER' })
    mocks.memberCount.mockResolvedValue(1)
    await expect(removeTenantMember('tenant-a', 'owner-a')).rejects.toMatchObject({ statusCode: 409 })
    expect(mocks.memberDelete).not.toHaveBeenCalled()
  })

  it('Member削除時は同TenantのMapMemberだけを消し、User本体は削除しない', async () => {
    await expect(removeTenantMember('tenant-a', 'user-a')).resolves.toEqual({ removedUserId: 'user-a' })
    expect(mocks.mapMemberDeleteMany).toHaveBeenCalledWith({ where: { userId: 'user-a', map: { tenantId: 'tenant-a' } } })
    expect(mocks.memberDelete).toHaveBeenCalledWith({ where: { id: 'tm-1' } })
  })

  it('同Tenant MemberだけをMap Editorへidempotentに割り当てる', async () => {
    await assignMapEditor('map-a', 'tenant-a', 'user-a')
    await assignMapEditor('map-a', 'tenant-a', 'user-a')
    expect(mocks.mapMemberUpsert).toHaveBeenCalledTimes(2)
    expect(mocks.mapMemberUpsert).toHaveBeenLastCalledWith({
      where: { mapId_userId: { mapId: 'map-a', userId: 'user-a' } },
      create: { mapId: 'map-a', userId: 'user-a', role: 'EDITOR' }, update: {},
    })
    mocks.memberFindUnique.mockResolvedValue(null)
    await expect(assignMapEditor('map-b', 'tenant-b', 'user-a')).rejects.toMatchObject({ statusCode: 422 })
  })

  it('複数組織membershipからactive組織だけをsessionへ選ぶ', async () => {
    mocks.memberFindMany.mockResolvedValue([
      { tenantId: 'tenant-a', role: 'OWNER', tenant: { name: '組織A' }, user: { email: 'u@example.com', displayName: null, authVersion: 1, isActive: true } },
      { tenantId: 'tenant-b', role: 'MEMBER', tenant: { name: '組織B' }, user: { email: 'u@example.com', displayName: null, authVersion: 1, isActive: true } },
    ])
    const user = await buildSessionUser('user-a', 'tenant-b')
    expect(user).toMatchObject({ tenantId: 'tenant-b', tenantRole: 'MEMBER', tenantName: '組織B' })
    expect(user?.organizations).toHaveLength(2)
  })

  it('Owner-only guardはDB roleを正本としてMemberを拒否する', async () => {
    mocks.memberFindUnique.mockResolvedValue({ role: 'MEMBER', tenant: { id: 'tenant-a' } })
    await expect(requireTenantOwner({} as never)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('Media LibraryはOwnerまたはMap Editorへ許可し、未割当Memberを拒否する', async () => {
    mocks.memberFindUnique.mockResolvedValue({ role: 'MEMBER', tenant: { id: 'tenant-a' } })
    await expect(requireTenantMediaAccess({} as never)).resolves.toMatchObject({ tenant: { id: 'tenant-a' } })
    mocks.mapMemberFindFirst.mockResolvedValue(null)
    await expect(requireTenantMediaAccess({} as never)).rejects.toMatchObject({ statusCode: 403 })
    expect(mocks.mapMemberFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-a', map: { tenantId: 'tenant-a' } } }))
  })
})
