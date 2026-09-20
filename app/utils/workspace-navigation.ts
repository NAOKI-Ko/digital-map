import type { TenantRole } from '~~/shared/types/organization'

export function workspaceRoleLabel(role: TenantRole) {
  return role === 'OWNER' ? 'オーナー' : 'メンバー'
}

export function workspaceSelectionAction(workspaceId: string, activeWorkspaceId: string | undefined) {
  return workspaceId === activeWorkspaceId ? 'navigate' : 'switch'
}
