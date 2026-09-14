import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ deliveryCreate: vi.fn(), deliveryUpdate: vi.fn() }))

describe('WU-26 transactional email', () => {
  let InMemoryMailProvider: typeof import('../server/utils/mail').InMemoryMailProvider
  let MailProviderError: typeof import('../server/utils/mail').MailProviderError
  let ResendMailProvider: typeof import('../server/utils/mail').ResendMailProvider
  let sendTransactionalMail: typeof import('../server/utils/mail').sendTransactionalMail
  let transactionalMailTemplate: typeof import('../server/utils/mail').transactionalMailTemplate

  beforeAll(async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ resendApiKey: '', mailFrom: '', mailReplyTo: '', publicBaseUrl: 'http://localhost:3000' }))
    vi.stubGlobal('prisma', { mailDelivery: { create: mocks.deliveryCreate, update: mocks.deliveryUpdate } })
    ;({ InMemoryMailProvider, MailProviderError, ResendMailProvider, sendTransactionalMail, transactionalMailTemplate } = await import('../server/utils/mail'))
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.deliveryCreate.mockResolvedValue({ id: 'delivery-1' })
    mocks.deliveryUpdate.mockResolvedValue({})
  })

  afterAll(() => vi.unstubAllGlobals())

  it('renders the exact one-time link without persisting it in delivery tracking', async () => {
    const url = 'https://public.example/reset-password?token=RAW_SECRET_TOKEN'
    const template = transactionalMailTemplate('PASSWORD_RESET', url)
    expect(template.text).toContain(url)
    const provider = new InMemoryMailProvider()
    await sendTransactionalMail({ purpose: 'PASSWORD_RESET', to: ' USER@Example.COM ', url }, { provider })
    expect(provider.messages[0]).toMatchObject({ to: 'user@example.com', purpose: 'PASSWORD_RESET' })
    expect(JSON.stringify(mocks.deliveryCreate.mock.calls)).not.toContain('RAW_SECRET_TOKEN')
    expect(JSON.stringify(mocks.deliveryUpdate.mock.calls)).not.toContain('RAW_SECRET_TOKEN')
  })

  it('retries transient failures at most three times with one stable idempotency key', async () => {
    const send = vi.fn()
      .mockRejectedValueOnce(new MailProviderError('http_429', true))
      .mockRejectedValueOnce(new MailProviderError('network', true))
      .mockResolvedValueOnce({ messageId: 'resend-1' })
    const sleep = vi.fn().mockResolvedValue(undefined)
    const result = await sendTransactionalMail({ purpose: 'ORGANIZATION_INVITATION', to: 'a@example.com', url: 'https://example.com/invite' }, { provider: { send }, sleep })
    expect(result.status).toBe('SENT')
    expect(send).toHaveBeenCalledTimes(3)
    expect(send.mock.calls.map(call => call[1])).toEqual(['delivery-1', 'delivery-1', 'delivery-1'])
    expect(sleep).toHaveBeenCalledTimes(2)
    expect(mocks.deliveryUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'SENT', attemptCount: 3 }) }))
  })

  it('does not retry permanent 4xx failures and stores only a sanitized category', async () => {
    const send = vi.fn().mockRejectedValue(new MailProviderError('http_422', false))
    const result = await sendTransactionalMail({ purpose: 'SPOT_EDITOR_INVITATION', to: 'a@example.com', url: 'https://example.com/invite' }, { provider: { send } })
    expect(result.status).toBe('FAILED')
    expect(send).toHaveBeenCalledTimes(1)
    expect(mocks.deliveryUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ data: { status: 'FAILED', attemptCount: 1, errorCategory: 'http_422' } }))
  })

  it('sends the Resend HTTPS request with idempotency and never logs credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'msg-1' }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)
    const provider = new ResendMailProvider('api-secret', 'Map <mail@example.com>')
    await provider.send({ purpose: 'SIGNUP_VERIFICATION', to: 'user@example.com', subject: '確認', text: 'text', html: '<p>text</p>' }, 'delivery-1')
    expect(fetchMock).toHaveBeenCalledWith('https://api.resend.com/emails', expect.objectContaining({
      method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer api-secret', 'Idempotency-Key': 'delivery-1' }),
    }))
  })
})
