import { z } from 'zod'

// Reject forged Workspace IDs and unsupported contract/payment fields.
export const planSimulationSchema = z.object({
  planCode: z.enum(['STANDARD', 'TOURISM', 'ENTERPRISE']),
  maxPublishedMaps: z.number().int().min(0).max(1_000_000).nullable(),
}).strict()
