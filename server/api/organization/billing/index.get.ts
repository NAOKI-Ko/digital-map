import { planCatalog, resolveEntitlements, resolveWorkspaceContract } from '../../../../shared/utils/workspace-plan'
import { resolveWorkspaceUsage } from '../../../utils/workspace-plan'

export default defineEventHandler(async (event) => {
  const { tenant, membership } = await requireTenantMember(event)
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const contract = resolveWorkspaceContract(tenant.id)
  return {
    workspace: { id: tenant.id, name: tenant.name }, contract,
    entitlements: resolveEntitlements(contract), usage: await resolveWorkspaceUsage(tenant.id),
    plans: planCatalog, authorization: { canSimulate: membership.role === 'OWNER' },
  }
})
