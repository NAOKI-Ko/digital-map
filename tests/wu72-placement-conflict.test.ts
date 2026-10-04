import { afterAll, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ transaction: vi.fn() }))
vi.mock('../server/utils/prisma', () => ({ prisma: { $transaction: mocks.transaction } }))
import { runPlacementMutation } from '../server/utils/illustration-placement'
describe('WU72 placement conflict recovery', () => {
  afterAll(() => vi.unstubAllGlobals())
  it.each(['P2034', 'P2002', 'P2025'])('returns a reloadable 409 for %s', async code => {
    vi.stubGlobal('createError', (input: object) => Object.assign(new Error(), input))
    mocks.transaction.mockRejectedValueOnce({ code })
    await expect(runPlacementMutation(async () => null)).rejects.toMatchObject({ statusCode: 409 })
  })
  it('does not mask unrelated database failures', async () => {
    const error = new Error('connection failed')
    mocks.transaction.mockRejectedValueOnce(error)
    await expect(runPlacementMutation(async () => null)).rejects.toBe(error)
  })
})
