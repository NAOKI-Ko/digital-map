import { planSimulationSchema } from '../../../../shared/schemas/workspace-plan'
import { simulateWorkspacePlan } from '../../../../shared/utils/workspace-plan'
import { resolveWorkspaceUsage } from '../../../utils/workspace-plan'

export default defineEventHandler(async (event) => {
  const { tenant } = await requireTenantOwner(event)
  const input = await readValidatedBody(event, planSimulationSchema.parse)
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  return simulateWorkspacePlan(input.planCode, await resolveWorkspaceUsage(tenant.id), input.maxPublishedMaps)
})
