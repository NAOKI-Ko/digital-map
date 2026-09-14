import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { LEGAL_EFFECTIVE_DATE, PRIVACY_VERSION, TERMS_VERSION } from '../content/legal/config'
import { privacyJa } from '../content/legal/privacy.ja'
import { termsJa } from '../content/legal/terms.ja'

describe('Terms / Privacy publication', () => {
  it('versionと適用日を単一の版管理configから公開する', () => {
    expect(TERMS_VERSION).toBe('2026-09-14-v1')
    expect(PRIVACY_VERSION).toBe('2026-09-14-v1')
    expect(LEGAL_EFFECTIVE_DATE).toBe('2026年9月14日')
    expect(termsJa.version).toBe(TERMS_VERSION)
    expect(privacyJa.version).toBe(PRIVACY_VERSION)
  })

  it('Privacyが実装済みaccount/email/log/analytics/cookie/media/retentionを正確に開示する', () => {
    const text = JSON.stringify(privacyJa)
    for (const required of ['メールアドレス', '組織', 'セッションCookie', '招待', 'パスワードリセット', '運用ログ', 'MAP_VIEW', 'SPOT_VIEW', 'IPアドレス', 'sessionStorage', '画像', '保持と削除']) expect(text).toContain(required)
    expect(text).toContain('広告追跡')
    expect(text).toContain('使用しません')
  })

  it('stable public routesが分離contentをrenderする', () => {
    expect(readFileSync(new URL('../app/pages/terms.vue', import.meta.url), 'utf8')).toContain('termsJa')
    expect(readFileSync(new URL('../app/pages/privacy.vue', import.meta.url), 'utf8')).toContain('privacyJa')
    const component = readFileSync(new URL('../app/components/legal/LegalDocument.vue', import.meta.url), 'utf8')
    expect(component).toContain('document.version')
    expect(component).toContain('document.effectiveDate')
    expect(component).toContain('legalContact')
  })

  it('公開Mapとloginから両ページへ到達できる', () => {
    for (const file of ['../app/pages/[mapSlug]/index.vue', '../app/pages/admin/login.vue']) {
      const source = readFileSync(new URL(file, import.meta.url), 'utf8')
      expect(source).toContain('to="/terms"')
      expect(source).toContain('to="/privacy"')
    }
  })
})
