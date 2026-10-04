export type PlanCode = 'STANDARD' | 'TOURISM' | 'ENTERPRISE'
export type ContractStatus = 'trial' | 'beta' | 'active'

export interface WorkspaceContract {
  workspaceId: string
  planCode: PlanCode
  status: ContractStatus
  source: 'beta-default'
}

export interface WorkspaceEntitlements {
  publicMap: boolean
  illustrationMap: boolean
  analytics: boolean
  csvImport: boolean
  csvExport: boolean
  // null means no enforced beta limit; it does not promise a paid unlimited plan.
  maxPublishedMaps: number | null
}

export interface PlanDefinition {
  code: PlanCode
  name: string
  audience: string
  description: string
  future: string
  action: string
  entitlements: Readonly<WorkspaceEntitlements>
}

export interface WorkspaceUsage {
  publishedMaps: number
  retainedMaps: number
  draftMaps: number
  archivedMaps: number
  storageBytes: number
  memberCount: number
}

export interface WorkspaceBilling {
  workspace: { id: string, name: string }
  contract: WorkspaceContract
  entitlements: WorkspaceEntitlements
  usage: WorkspaceUsage
  plans: PlanDefinition[]
  authorization: { canSimulate: boolean }
}

export interface PlanSimulation {
  persisted: false
  planCode: PlanCode
  entitlements: WorkspaceEntitlements
  usage: WorkspaceUsage
  overLimit: boolean
  canIncreasePublishedMaps: boolean
  existingPublishedMapsPreserved: true
}
