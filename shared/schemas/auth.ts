import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('有効なメールアドレスを入力してください。'),
  password: z.string().min(1, 'パスワードを入力してください。'),
})

export type LoginInput = z.infer<typeof loginSchema>

const passwordSchema = z.string().min(12, 'パスワードは12文字以上で入力してください。').max(128)

export const acceptInvitationSchema = z.object({
  token: z.string().min(32).max(512),
  password: passwordSchema.optional(),
})

export const passwordResetRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
})

export const passwordResetSchema = z.object({
  token: z.string().min(32).max(512),
  password: passwordSchema,
})

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
})
