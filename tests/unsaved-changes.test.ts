import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const guard = readFileSync(new URL('../app/components/admin/UnsavedChangesGuard.vue', import.meta.url), 'utf8')
const spotForm = readFileSync(new URL('../app/components/admin/SpotForm.vue', import.meta.url), 'utf8')

describe('未保存変更ガード', () => {
  it('cleanなら通過し、dirtyな内部遷移だけを保留する', () => {
    expect(guard).toContain('if (!props.dirty || bypassNextNavigation) return true')
    expect(guard).toContain('return false')
  })
  it('編集継続は入力を破棄せず、明示破棄だけが保留先へ移動する', () => {
    expect(guard).toContain('function stay()')
    expect(guard).toContain('await navigateTo(destination)')
    expect(guard).toContain('編集を続ける')
    expect(guard).toContain('破棄して移動')
  })
  it('browser reload/closeだけbeforeunloadを使う', () => {
    expect(guard).toContain("addEventListener('beforeunload'")
    expect(guard).not.toContain('window.confirm')
  })
  it('Spot formは送信中をdirty扱いせず、reset後にmetaをclearできる', () => {
    expect(spotForm).toContain(':dirty="meta.dirty && !isSubmitting"')
    expect(spotForm).toContain('resetForm({ values: value })')
  })
})
