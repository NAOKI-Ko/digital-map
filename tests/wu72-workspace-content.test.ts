import { describe, expect, it } from 'vitest'
import { workspaceContentInput } from '../server/utils/workspace-spot'
const content = { expectedContentVersion: 1, name: 'Content', description: null, address: null, phone: null, website: null, hoursText: null, holidayText: null, customValues: {} }
describe('WU72 retained canonical content validation', () => {
  it.each(['javascript:alert(1)', 'data:text/html,<h1>x</h1>', 'file:///etc/passwd'])('rejects unsafe website %s at the Owner boundary', website => {
    expect(workspaceContentInput.safeParse({ ...content, website }).success).toBe(false)
  })
  it.each([null, 'https://example.invalid/info', 'http://example.invalid'])('keeps the existing public website contract for %s', website => {
    expect(workspaceContentInput.safeParse({ ...content, website }).success).toBe(true)
  })
})
