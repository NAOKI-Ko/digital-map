import { z } from 'zod'

export const organizationInvitationSchema = z.object({
  email: z.string().trim().toLowerCase().email('有効なメールアドレスを入力してください。'),
})

export const organizationSwitchSchema = z.object({ tenantId: z.string().min(1) })
export const addOrganizationMemberSchema = z.object({
  email: z.string().trim().email('メールアドレスを確認してください。'),
})
export const updateOrganizationMemberSchema = z.object({ role: z.enum(['OWNER', 'MEMBER']) })
export const organizationSettingsSchema = z.object({
  name: z.string().trim().min(1).max(100),
  logoUrl: z.string().trim().startsWith('/uploads/').nullable().optional(),
  logoAssetId: z.string().min(1).nullable().optional(),
  websiteUrl: z.string().trim().url().nullable().optional(),
  snsUrl: z.string().trim().url().nullable().optional(),
})
export const addMapEditorSchema = z.object({ userId: z.string().min(1) })
