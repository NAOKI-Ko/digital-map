import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { categoryUpdateSchema } from '~~/shared/schemas/category'

const root = new URL('..', import.meta.url)

function source(relativePath: string) {
  return readFileSync(new URL(relativePath.replace(/^\//, ''), root), 'utf8')
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.(?:js|ts|vue)$/.test(entry.name) ? [path] : []
  })
}

describe('native browser dialog regression', () => {
  it('production source does not call alert, confirm, or prompt', () => {
    const files = [
      ...sourceFiles(fileURLToPath(new URL('../app', import.meta.url))),
      ...sourceFiles(fileURLToPath(new URL('../server', import.meta.url))),
    ]

    for (const file of files) {
      const contents = readFileSync(file, 'utf8')
      expect(contents, file).not.toMatch(/\bwindow\s*\.\s*(?:alert|confirm|prompt)\s*\(/)
      expect(contents, file).not.toMatch(/(?<![\w.])(?:alert|confirm|prompt)\s*\(/)
    }
  })
})

describe('application dialog accessibility contract', () => {
  const appDialog = source('/app/components/ui/AppDialog.vue')
  const confirmDialog = source('/app/components/ui/ConfirmDialog.vue')
  const uiDialog = source('/app/components/ui/UiDialog.vue')
  const uiAlertDialog = source('/app/components/ui/UiAlertDialog.vue')

  it('delegates modal semantics, focus trapping, Escape, and focus return to Reka UI', () => {
    expect(appDialog).toContain("import UiDialog from './UiDialog.vue'")
    expect(uiDialog).toContain("from 'reka-ui'")
    expect(uiDialog).toContain('DialogRoot')
    expect(uiDialog).toContain('DialogPortal')
    expect(uiDialog).toContain('DialogOverlay')
    expect(uiDialog).toContain('DialogContent')
    expect(uiDialog).toContain('DialogTitle')
    expect(uiDialog).toContain('DialogDescription')
  })

  it('provides explicit cancel and destructive confirmation actions', () => {
    expect(confirmDialog).toContain("cancelLabel: 'キャンセル'")
    expect(confirmDialog).toContain("emit('confirm')")
    expect(confirmDialog).toContain("if (!props.busy) emit('cancel')")
    expect(confirmDialog).toContain('UiAlertDialog')
    expect(uiAlertDialog).toContain('AlertDialogCancel')
    expect(uiAlertDialog).toContain('AlertDialogAction')
    expect(uiAlertDialog).toContain(':class="destructive')
  })

  it('does not emit cancel after an explicit alert-dialog action', () => {
    expect(uiAlertDialog).toContain('@click.capture="markCloseHandled"')
    expect(uiAlertDialog).toContain("!closeHandledByButton) emit('cancel')")
    expect(uiAlertDialog).toContain('@click="emitConfirmAction"')
    expect(uiAlertDialog).toContain('@click="emitCancelAction"')
  })
})

describe('category rename dialog contract', () => {
  const categories = source('/app/pages/admin/maps/[mapId]/categories.vue')

  it('opens with the current value and exposes formal save/cancel actions', () => {
    expect(categories).toContain('editName.value = category.name')
    expect(categories).toContain('title="カテゴリー名を編集"')
    expect(categories).toContain('v-model="editName" autofocus')
    expect(categories).toContain('@submit.prevent="saveCategory"')
    expect(categories).toContain('@click="closeEditor"')
  })

  it('uses shared validation and keeps API errors inside the dialog', () => {
    expect(categories).toContain('categoryUpdateSchema.safeParse')
    expect(categories).toContain("editError.value = error?.data?.statusMessage")
    expect(categories).toContain('v-if="editError" role="alert"')
    expect(categoryUpdateSchema.safeParse({ name: '', iconType: null, iconPresetId: null, iconImageUrl: null }).success).toBe(false)
    expect(categoryUpdateSchema.safeParse({ name: '   ', iconType: null, iconPresetId: null, iconImageUrl: null }).success).toBe(false)
  })

  it('submits with Enter but suppresses IME composition Enter', () => {
    expect(categories).toContain('@keydown.enter="handleEditEnter"')
    expect(categories).toContain('event.isComposing')
    expect(categories).toContain('event.preventDefault()')
    expect(categories).toContain('void saveCategory()')
  })
})

describe('native dialog replacements', () => {
  it.each([
    '/app/components/admin/ImageUploader.vue',
    '/app/components/admin/SpotPhotoManager.vue',
    '/app/pages/admin/maps/[mapId]/floors.vue',
    '/app/pages/admin/maps/[mapId]/spots/index.vue',
  ])('%s uses the shared confirmation dialog', (file) => {
    expect(source(file)).toContain('ConfirmDialog')
  })

  it('shows floor operation failures inline', () => {
    const floors = source('/app/pages/admin/maps/[mapId]/floors.vue')
    expect(floors).toContain('<SaveFeedback class="mt-6" :state="saveState" :message="saveMessage"')
    expect(floors).toContain("saveState.value = 'error'")
    expect(floors).toContain("operationError.value = 'フロアを保存できませんでした。もう一度お試しください。'")
    expect(floors).toContain("operationError.value = 'フロアを削除できませんでした。もう一度お試しください。'")
  })
})
