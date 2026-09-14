import { Prisma } from '../../prisma/generated/client'

const secretKey = /(password|secret|token|cookie|authorization|api.?key|header|body|hash)/i

export function sanitizeAuditMetadata(value: unknown): Prisma.InputJsonValue | null {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'number') return Number.isFinite(value) ? value : String(value)
  if (Array.isArray(value)) return value.map(sanitizeAuditMetadata)
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !secretKey.test(key))
      .map(([key, child]) => [key, sanitizeAuditMetadata(child)]))
  }
  return String(value)
}

interface AuditWriter {
  auditEvent: { create(args: { data: Record<string, unknown> }): Promise<unknown> }
}

export async function appendAuditEvent(client: AuditWriter, input: {
  tenantId: string
  actorUserId?: string | null
  action: string
  targetType: string
  targetId: string
  mapId?: string | null
  metadata?: unknown
}) {
  return client.auditEvent.create({ data: {
    tenantId: input.tenantId,
    actorUserId: input.actorUserId ?? null,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    mapId: input.mapId ?? null,
    metadata: sanitizeAuditMetadata(input.metadata ?? {}) ?? Prisma.JsonNull,
  } })
}
