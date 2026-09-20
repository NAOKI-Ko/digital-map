import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { defaultSpotFieldDefinitions } from '../shared/constants/spot-fields'
import { ensureDefaultSpotFieldDefinitions, inspectDefaultSpotFieldInvariant } from '../server/utils/spot-field'

type StoredField = {
  id: string
  mapId: string
  kind: string
  semanticKey: string | null
  label: string
  type: string
  enabled: boolean
  publicVisible: boolean
  required: boolean
  order: number
}

function defaultField(semanticKey: string, overrides: Partial<StoredField> = {}): StoredField {
  const definition = defaultSpotFieldDefinitions.find(field => field.semanticKey === semanticKey)
  if (!definition) throw new Error(`Unknown default: ${semanticKey}`)
  return { id: `field-${semanticKey}`, mapId: 'map-1', ...definition, ...overrides }
}

function mockClient(initial: StoredField[]) {
  const fields = initial.map(field => ({ ...field }))
  const createdBatches: StoredField[][] = []
  const client = {
    spotFieldDefinition: {
      findMany: async (args: any) => {
        const selected = fields.filter(field => field.mapId === args.where.mapId)
        if (args.where.kind) return selected.filter(field => field.kind === args.where.kind).map(field => ({ semanticKey: field.semanticKey }))
        return selected.map(field => ({ kind: field.kind, semanticKey: field.semanticKey, order: field.order }))
      },
      createMany: async ({ data }: { data: StoredField[] }) => {
        const created = data.filter(candidate => !fields.some(field => field.mapId === candidate.mapId && field.semanticKey === candidate.semanticKey))
          .map((candidate, index) => ({ ...candidate, id: `created-${createdBatches.length}-${index}` }))
        fields.push(...created)
        createdBatches.push(created)
        return { count: created.length }
      },
    },
  }
  return { client: client as never, fields, createdBatches }
}

describe('WU-54 default Spot Field invariant', () => {
  it('empty Map creates the canonical six defaults', async () => {
    const { client, fields } = mockClient([])
    const result = await ensureDefaultSpotFieldDefinitions(client, 'map-1')
    expect(result.createdSemanticKeys).toEqual(defaultSpotFieldDefinitions.map(field => field.semanticKey))
    expect(result.finalStandardCount).toBe(6)
    expect(fields.map(field => field.order)).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('complete Map creates nothing and is idempotent', async () => {
    const { client, createdBatches } = mockClient(defaultSpotFieldDefinitions.map(field => defaultField(field.semanticKey)))
    expect((await ensureDefaultSpotFieldDefinitions(client, 'map-1')).createdSemanticKeys).toEqual([])
    expect((await ensureDefaultSpotFieldDefinitions(client, 'map-1')).createdSemanticKeys).toEqual([])
    expect(createdBatches).toEqual([])
  })

  it('partial Map adds only missing defaults without changing a customized default or custom field', async () => {
    const customized = defaultField('hours', { label: '開館時間', enabled: false, publicVisible: false, required: true, order: 20 })
    const custom: StoredField = { id: 'custom-1', mapId: 'map-1', kind: 'custom', semanticKey: null, label: '駐車台数', type: 'number', enabled: true, publicVisible: true, required: false, order: 21 }
    const before = structuredClone([customized, custom])
    const { client, fields } = mockClient([customized, custom])
    const result = await ensureDefaultSpotFieldDefinitions(client, 'map-1')
    expect(result.existingSemanticKeys).toEqual(['hours'])
    expect(result.createdSemanticKeys).toEqual(['description', 'address', 'holiday', 'website', 'phone'])
    expect(fields.slice(0, 2)).toEqual(before)
    expect(fields.filter(field => field.kind === 'custom')).toEqual([before[1]])
  })

  it('order collision appends missing defaults and never reorders existing definitions', async () => {
    const existing = defaultField('hours', { order: 0 })
    const { client, fields } = mockClient([existing])
    await ensureDefaultSpotFieldDefinitions(client, 'map-1')
    expect(fields[0]?.order).toBe(0)
    expect(fields.slice(1).map(field => field.order)).toEqual([1, 2, 3, 4, 5])
  })

  it('audit catches missing and duplicate standard keys while ignoring custom fields', () => {
    const complete = defaultSpotFieldDefinitions.map(field => ({ kind: 'standard', semanticKey: field.semanticKey }))
    expect(inspectDefaultSpotFieldInvariant([...complete, { kind: 'custom', semanticKey: null }]).valid).toBe(true)
    const missing = inspectDefaultSpotFieldInvariant(complete.filter(field => field.semanticKey !== 'phone'))
    expect(missing.valid).toBe(false)
    expect(missing.missingSemanticKeys).toEqual(['phone'])
    const duplicate = inspectDefaultSpotFieldInvariant([...complete, { kind: 'standard', semanticKey: 'hours' }])
    expect(duplicate.valid).toBe(false)
    expect(duplicate.duplicateSemanticKeys).toEqual(['hours'])
  })

  it('normal Map POST and the WU-53 builder both enforce defaults through the shared helper', () => {
    const mapPost = readFileSync(new URL('../server/api/maps/index.post.ts', import.meta.url), 'utf8')
    const baselineBuilder = readFileSync(new URL('../scripts/qa/arimatsu-baseline-reset.ts', import.meta.url), 'utf8')
    expect(mapPost).toContain('ensureDefaultSpotFieldDefinitions(transaction, created.id)')
    expect(baselineBuilder).toContain('ensureDefaultSpotFieldDefinitions(transaction, map.id)')
    expect(baselineBuilder).not.toContain('defaultSpotFieldDefinitions.map')
  })

  it('authoritative baseline manifest records the default-field invariant', () => {
    const bundle = readFileSync(new URL('../scripts/qa/create-baseline-bundle.ts', import.meta.url), 'utf8')
    expect(bundle).toContain('standardSpotFieldsPerMap: standardSpotFieldKeys.length')
    expect(bundle).toContain('standardSpotFieldSemanticKeys: [...standardSpotFieldKeys]')
  })

  it('repair is explicitly guarded and GET remains read-only', () => {
    const repair = readFileSync(new URL('../scripts/qa/repair-default-spot-fields.ts', import.meta.url), 'utf8')
    const getEndpoint = readFileSync(new URL('../server/api/maps/[mapId]/spot-fields/index.get.ts', import.meta.url), 'utf8')
    expect(repair).toContain('QA_SPOT_FIELD_REPAIR_ENV')
    expect(repair).toContain('I_UNDERSTAND_THIS_ADDS_MISSING_DEFAULT_FIELDS')
    expect(repair).toContain("process.env.DEPLOYMENT_ENV === 'production'")
    expect(getEndpoint).not.toContain('ensureDefaultSpotFieldDefinitions')
    expect(getEndpoint).not.toMatch(/\.create(Many)?\(/)
    expect(getEndpoint).not.toMatch(/\.update(Many)?\(/)
  })
})
