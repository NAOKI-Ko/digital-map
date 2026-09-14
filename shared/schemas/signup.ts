import { z } from 'zod'

const email = z.string().trim().toLowerCase().email('有効なメールアドレスを入力してください。')
const password = z.string().min(12, 'パスワードは12文字以上で入力してください。').max(128)

export const signupSchema = z.object({
  email,
  password,
  organizationName: z.string().trim().min(1, '組織名を入力してください。').max(100),
  acceptTerms: z.literal(true, { error: '利用規約への同意が必要です。' }),
  acceptPrivacy: z.literal(true, { error: 'プライバシーポリシーへの同意が必要です。' }),
})
export const signupVerificationSchema = z.object({ token: z.string().min(32).max(512) })
export const signupResendSchema = z.object({ email })
export const completeExistingSignupSchema = z.object({ intentId: z.string().min(1), acceptTerms: z.literal(true), acceptPrivacy: z.literal(true) })
