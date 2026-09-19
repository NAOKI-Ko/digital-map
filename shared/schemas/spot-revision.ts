import { z } from 'zod'

export const spotEditorAssignmentSchema = z.object({ userId: z.string().min(1) })
export const spotEditorInviteSchema = z.object({ email: z.string().trim().toLowerCase().email() })

export const spotRevisionPayloadSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().max(10_000).nullable(),
  address: z.string().max(500).nullable(),
  phone: z.string().max(100).nullable(),
  website: z.string().url().max(2_000).nullable(),
  hoursText: z.string().max(2_000).nullable(),
  holidayText: z.string().max(2_000).nullable(),
  fieldValues: z.array(z.object({ fieldDefinitionId: z.string().min(1), valueJson: z.json() })).max(200),
  photoAssetIds: z.array(z.string().min(1)).max(50).refine(ids => new Set(ids).size === ids.length, '写真が重複しています。'),
}).strict()

export type SpotRevisionPayload = z.infer<typeof spotRevisionPayloadSchema>

export const rejectSpotRevisionSchema = z.object({ reason: z.string().trim().min(1).max(1_000) })
