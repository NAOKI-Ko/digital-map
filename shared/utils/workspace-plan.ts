import type { PlanCode, PlanDefinition, PlanSimulation, WorkspaceContract, WorkspaceEntitlements, WorkspaceUsage } from '../types/workspace-plan'

const betaCapabilities: Readonly<WorkspaceEntitlements> = Object.freeze({
  publicMap: true, illustrationMap: true, analytics: true, csvImport: true, csvExport: true,
  maxPublishedMaps: null,
})

export const planCatalog: readonly PlanDefinition[] = [
  {
    code: 'STANDARD', name: 'Standard', audience: '一般施設・店舗・小規模地域向け',
    description: 'Public Mapとイラストマップを中心に、基本Analytics・CSVで運用するDigital Map SaaSの基本プラン。',
    future: '現在の基本プラン。正式な料金・上限は未確定です。', action: '基本プランの案内', entitlements: betaCapabilities,
  },
  {
    code: 'TOURISM', name: 'Tourism / Area', audience: '自治体・DMO・観光協会・地域運営向け',
    description: '地域の観光情報を複数Mapで育てる、観光プラットフォーム向けの商品区分。Map数だけで区分するプランではありません。',
    future: '多言語の地域運用・統合Analytics・共同運用・観光DXは今後の拡張構想です。本プランの追加機能としては未提供です。', action: '相談する（Mock）', entitlements: betaCapabilities,
  },
  {
    code: 'ENTERPRISE', name: 'Enterprise', audience: '大規模運用・複数施設・個別要件向け',
    description: '大規模企業・自治体・観光事業者向けの個別契約枠。要件を伺い、提供範囲を個別に検討します。',
    future: 'SSO・API・SLA・専用サポートは将来の検討候補で、現時点では未提供です。', action: '問い合わせ（Mock）', entitlements: betaCapabilities,
  },
]

// Provider boundary: replace this with a Workspace assignment store when contracts
// are introduced. No User plan, payment provider or invented billing entity.
export function resolveWorkspaceContract(workspaceId: string): WorkspaceContract {
  return { workspaceId, planCode: 'STANDARD', status: 'beta', source: 'beta-default' }
}

export function resolveEntitlements(contract: Pick<WorkspaceContract, 'planCode'>): WorkspaceEntitlements {
  const definition = planCatalog.find(plan => plan.code === contract.planCode)
  if (!definition) throw new Error('Unknown plan code')
  return { ...definition.entitlements }
}

// Entitlement policy only. Callers must separately authorize the actor.
// Safe edits / rollback (delta 0), reduction / unpublish (delta -1) stay allowed.
export function canChangePublishedMapUsage(usage: number, limit: number | null, delta: -1 | 0 | 1) {
  return delta <= 0 || limit === null || usage + delta <= limit
}

export function simulateWorkspacePlan(planCode: PlanCode, usage: WorkspaceUsage, maxPublishedMaps: number | null): PlanSimulation {
  const entitlements = { ...resolveEntitlements({ planCode }), maxPublishedMaps }
  return {
    persisted: false, planCode, entitlements, usage,
    overLimit: maxPublishedMaps !== null && usage.publishedMaps > maxPublishedMaps,
    canIncreasePublishedMaps: canChangePublishedMapUsage(usage.publishedMaps, maxPublishedMaps, 1),
    existingPublishedMapsPreserved: true,
  }
}

export function formatStorageBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length)
  return `${new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 1 }).format(bytes / 1024 ** exponent)} ${units[exponent - 1]}`
}
