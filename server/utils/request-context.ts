import { randomUUID } from 'node:crypto'
import type { H3Event } from 'h3'

const safeRequestId = /^[A-Za-z0-9][A-Za-z0-9._-]{7,99}$/

export function resolveRequestId(candidate?: string) {
  return candidate && safeRequestId.test(candidate) ? candidate : randomUUID()
}

export function requestIdFor(event: H3Event) {
  return typeof event.context.requestId === 'string' ? event.context.requestId : 'unknown'
}
