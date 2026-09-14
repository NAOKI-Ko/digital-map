import { normalizeAuthEmail } from './auth-tokens'

export type TransactionalMailPurpose = 'ORGANIZATION_INVITATION' | 'SPOT_EDITOR_INVITATION' | 'PASSWORD_RESET' | 'SIGNUP_VERIFICATION'

export interface MailMessage {
  purpose: TransactionalMailPurpose
  to: string
  subject: string
  text: string
  html: string
}

export interface MailProviderResult { messageId: string }
export interface MailProvider { send(message: MailMessage, idempotencyKey: string): Promise<MailProviderResult> }

export class MailProviderError extends Error {
  constructor(public category: string, public transient: boolean) { super(`Mail provider failure: ${category}`) }
}

export class InMemoryMailProvider implements MailProvider {
  readonly messages: MailMessage[] = []
  async send(message: MailMessage, idempotencyKey: string) {
    this.messages.push(structuredClone(message))
    return { messageId: `fake-${idempotencyKey}` }
  }
}

export class ResendMailProvider implements MailProvider {
  constructor(private apiKey: string, private from: string, private replyTo?: string) {}
  async send(message: MailMessage, idempotencyKey: string): Promise<MailProviderResult> {
    let response: Response
    try {
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({ from: this.from, to: [message.to], subject: message.subject, text: message.text, html: message.html, ...(this.replyTo ? { reply_to: this.replyTo } : {}) }),
      })
    }
    catch { throw new MailProviderError('network', true) }
    if (!response.ok) throw new MailProviderError(`http_${response.status}`, response.status === 429 || response.status >= 500)
    const data = await response.json() as { id?: string }
    if (!data.id) throw new MailProviderError('invalid_response', false)
    return { messageId: data.id }
  }
}

export function createMailProvider(): MailProvider {
  const config = useRuntimeConfig()
  const explicitlyFake = process.env.MAIL_PROVIDER === 'fake'
  if (process.env.NODE_ENV !== 'production' || explicitlyFake) return new InMemoryMailProvider()
  if (!config.resendApiKey || !config.mailFrom) throw new MailProviderError('not_configured', false)
  return new ResendMailProvider(String(config.resendApiKey), String(config.mailFrom), config.mailReplyTo ? String(config.mailReplyTo) : undefined)
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)

export function transactionalMailTemplate(purpose: TransactionalMailPurpose, url: string): Omit<MailMessage, 'purpose' | 'to'> {
  const labels: Record<TransactionalMailPurpose, { subject: string, intro: string }> = {
    ORGANIZATION_INVITATION: { subject: '組織への招待', intro: 'デジタルマップの組織へ招待されました。' },
    SPOT_EDITOR_INVITATION: { subject: 'Spot担当者への招待', intro: 'Spot担当者として招待されました。' },
    PASSWORD_RESET: { subject: 'パスワード再設定', intro: 'パスワードを再設定するには、次のリンクを開いてください。' },
    SIGNUP_VERIFICATION: { subject: 'メールアドレスの確認', intro: '登録を完了するには、メールアドレスを確認してください。' },
  }
  const label = labels[purpose]
  return { subject: label.subject, text: `${label.intro}\n\n${url}\n\n心当たりがない場合は、このメールを破棄してください。`, html: `<p>${escapeHtml(label.intro)}</p><p><a href="${escapeHtml(url)}">手続きを続ける</a></p><p>心当たりがない場合は、このメールを破棄してください。</p>` }
}

export async function sendTransactionalMail(input: { purpose: TransactionalMailPurpose, to: string, url: string }, options: {
  provider?: MailProvider
  sleep?: (milliseconds: number) => Promise<void>
} = {}) {
  const delivery = await prisma.mailDelivery.create({ data: { purpose: input.purpose, recipient: normalizeAuthEmail(input.to) } })
  let provider: MailProvider
  try { provider = options.provider ?? createMailProvider() }
  catch (error) {
    const category = error instanceof MailProviderError ? error.category : 'not_configured'
    await prisma.mailDelivery.update({ where: { id: delivery.id }, data: { status: 'FAILED', attemptCount: 0, errorCategory: category } })
    return { deliveryId: delivery.id, status: 'FAILED' as const }
  }
  const sleep = options.sleep ?? ((milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds)))
  const message: MailMessage = { purpose: input.purpose, to: normalizeAuthEmail(input.to), ...transactionalMailTemplate(input.purpose, input.url) }
  let lastCategory = 'unknown'
  let attempts = 0
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    attempts = attempt
    try {
      const result = await provider.send(message, delivery.id)
      await prisma.mailDelivery.update({ where: { id: delivery.id }, data: { status: 'SENT', attemptCount: attempt, providerMessageId: result.messageId, sentAt: new Date(), errorCategory: null } })
      return { deliveryId: delivery.id, status: 'SENT' as const }
    }
    catch (error) {
      const providerError = error instanceof MailProviderError ? error : new MailProviderError('unknown', false)
      lastCategory = providerError.category
      if (!providerError.transient || attempt === 3) break
      await sleep(100 * 2 ** (attempt - 1))
    }
  }
  await prisma.mailDelivery.update({ where: { id: delivery.id }, data: { status: 'FAILED', attemptCount: attempts, errorCategory: lastCategory } })
  return { deliveryId: delivery.id, status: 'FAILED' as const }
}
