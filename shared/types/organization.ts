export type TenantRole = 'OWNER' | 'MEMBER'

export interface OrganizationSummary {
  id: string
  name: string
  role: TenantRole
}

export interface OrganizationMemberItem {
  userId: string
  email: string
  displayName: string | null
  role: TenantRole
  assignedMaps: Array<{ id: string, name: string }>
}

export interface OrganizationMembersResponse {
  members: OrganizationMemberItem[]
}

export interface MapEditorsResponse {
  editors: Array<{ userId: string, email: string, displayName: string | null }>
  candidates: Array<{ userId: string, email: string, displayName: string | null }>
}

