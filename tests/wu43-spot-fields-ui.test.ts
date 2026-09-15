import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const root = new URL('..', import.meta.url)
const source = (path: string) => readFileSync(new URL(path, root), 'utf8')

describe('WU-43 Reka wrapper contracts', () => {
  const select = source('app/components/ui/UiSelect.vue')
  const uiSwitch = source('app/components/ui/UiSwitch.vue')
  const dialog = source('app/components/ui/UiDialog.vue')
  const alertDialog = source('app/components/ui/UiAlertDialog.vue')

  it('Select uses stable values, portal, popper collision handling, and viewport constraints', () => {
    expect(select).toContain(':key="option.value"')
    expect(select).toContain(':value="option.value"')
    expect(select).toContain('SelectPortal')
    expect(select).toContain('position="popper"')
    expect(select).toContain(':collision-padding="12"')
    expect(select).toContain('--reka-select-trigger-width')
    expect(select).toContain('--reka-select-content-available-height')
    expect(select).toContain('@update:open')
    expect(select).toContain(':disabled="option.disabled"')
  })

  it('Switch and dialogs delegate keyboard/focus semantics to Reka', () => {
    expect(uiSwitch).toContain('SwitchRoot')
    expect(uiSwitch).toContain('SwitchThumb')
    expect(uiSwitch).toContain(':disabled="disabled"')
    expect(uiSwitch).toContain('@update:model-value')
    expect(dialog).toContain('DialogPortal')
    expect(dialog).toContain('DialogTitle')
    expect(alertDialog).toContain('AlertDialogCancel')
    expect(alertDialog).toContain('AlertDialogAction')
  })
})

describe('WU-43 Spot Fields screen contracts', () => {
  const page = source('app/pages/admin/maps/[mapId]/fields.vue')

  it('renders a compact summary and only the active field editor', () => {
    expect(page).toContain('v-for="(field, index) in fields"')
    expect(page).toContain("field.kind === 'standard' ? '標準' : 'カスタム'")
    expect(page).toContain('fieldTypeLabels[field.type]')
    expect(page).toContain('件で使用中')
    expect(page).toContain('v-if="activeId === field.id && draft"')
    expect(page).not.toMatch(/v-model\.number="field\.order"/)
    expect(page).not.toContain('>順序<input')
  })

  it('offers top add, Save/Cancel, and a three-way dirty guard', () => {
    expect(page.indexOf('＋ 項目を追加')).toBeLessThan(page.indexOf('<ol'))
    expect(page).toContain('@submit.prevent="saveActive()"')
    expect(page).toContain('@click="closeEditor">キャンセル')
    expect(page).toContain('dirtyDialogOpen')
    expect(page).toContain('保存して続ける')
    expect(page).toContain('破棄して続ける')
    expect(page).toContain('pendingAction')
  })

  it('keeps standard/in-use restrictions and dependent visibility semantics', () => {
    expect(page).toContain("current.kind === 'custom' ? { type: current.type } : {}")
    expect(page).toContain('draft.valueCount > 0')
    expect(page).toContain('標準項目は削除・種類変更できません。')
    expect(page).toContain('if (!value) draft.value.publicVisible = false')
    expect(page).toContain(':disabled="!draft.enabled"')
  })

  it('supports drag reorder, accessible up/down fallback, and transactional persistence', () => {
    expect(page).toContain('draggable="true"')
    expect(page).toContain('@drop.prevent="dropOn(field.id)"')
    expect(page).toContain('を上へ移動')
    expect(page).toContain('を下へ移動')
    expect(page).toContain('/spot-fields/reorder')
    expect(page).toContain('body: { orderedIds }')
  })
})

const mocks = vi.hoisted(() => ({
  requireOwnedMap: vi.fn(),
  readBody: vi.fn(),
  findMany: vi.fn(),
  update: vi.fn(),
  transaction: vi.fn(),
}))

type Handler = (event: unknown) => Promise<unknown>
let handler: Handler

describe('WU-43 reorder API', () => {
  beforeAll(async () => {
    vi.stubGlobal('defineEventHandler', (value: Handler) => value)
    vi.stubGlobal('requireOwnedMap', mocks.requireOwnedMap)
    vi.stubGlobal('readBody', mocks.readBody)
    vi.stubGlobal('createError', (input: { statusCode: number, statusMessage: string }) => Object.assign(new Error(input.statusMessage), input))
    vi.stubGlobal('prisma', {
      spotFieldDefinition: { findMany: mocks.findMany, update: mocks.update },
      $transaction: mocks.transaction,
    })
    handler = (await import('../server/api/maps/[mapId]/spot-fields/reorder.patch')).default as Handler
  })

  beforeEach(() => {
    mocks.requireOwnedMap.mockReset().mockResolvedValue({ map: { id: 'map-a' } })
    mocks.readBody.mockReset().mockResolvedValue({ orderedIds: ['field-b', 'field-a'] })
    mocks.findMany.mockReset().mockResolvedValue([{ id: 'field-a' }, { id: 'field-b' }])
    mocks.update.mockReset().mockImplementation(args => args)
    mocks.transaction.mockReset().mockResolvedValue([])
  })

  afterAll(() => vi.unstubAllGlobals())

  it('rejects a stale or cross-map field list before writes', async () => {
    mocks.readBody.mockResolvedValue({ orderedIds: ['field-b', 'foreign'] })
    await expect(handler({})).rejects.toMatchObject({ statusCode: 409 })
    expect(mocks.update).not.toHaveBeenCalled()
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('normalizes every order in one transaction', async () => {
    await expect(handler({})).resolves.toEqual({ orderedIds: ['field-b', 'field-a'] })
    expect(mocks.update).toHaveBeenNthCalledWith(1, { where: { id: 'field-b' }, data: { order: 0 } })
    expect(mocks.update).toHaveBeenNthCalledWith(2, { where: { id: 'field-a' }, data: { order: 1 } })
    expect(mocks.transaction).toHaveBeenCalledOnce()
  })
})
