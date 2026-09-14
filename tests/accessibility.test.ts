// @vitest-environment happy-dom
import { beforeAll, describe, expect, it } from 'vitest'

let axe: typeof import('axe-core').default
beforeAll(async () => { axe = (await import('axe-core')).default })

async function expectNoSeriousViolations(html: string) {
  document.documentElement.lang = 'ja'
  document.title = 'Accessibility test'
  document.body.innerHTML = html
  const result = await axe.run(document, { rules: { 'color-contrast': { enabled: false } } })
  expect(result.violations.filter(item => item.impact === 'critical' || item.impact === 'serious')).toEqual([])
}

function luminance(hex: string) {
  const values = hex.match(/[a-f0-9]{2}/gi)!.map(value => Number.parseInt(value, 16) / 255).map(value => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  return values[0]! * 0.2126 + values[1]! * 0.7152 + values[2]! * 0.0722
}
function contrast(a: string, b: string) { const [light, dark] = [luminance(a), luminance(b)].toSorted((x, y) => y - x); return (light + 0.05) / (dark + 0.05) }

describe('WCAG 2.2 AA-oriented public baseline', () => {
  it('public Map initial/category/list stateにcritical/serious違反がない', async () => {
    await expectNoSeriousViolations(`<main><header><h1>地域Map</h1><label for="locale">言語</label><select id="locale"><option>日本語</option></select></header><section aria-label="地図"><div role="tablist" aria-label="フロア"><button role="tab" aria-selected="true">1階</button></div><div role="group" aria-label="カテゴリで絞り込み"><button aria-pressed="true">すべて</button><button aria-pressed="false">観光</button></div><div role="region" tabindex="0" aria-label="地域Map 1階"></div><details><summary>Spot一覧から選ぶ</summary><ul><li><button>博物館</button></li></ul></details></section></main>`)
  })

  it('Spot Bottom Sheet dialog状態にcritical/serious違反がない', async () => {
    await expectNoSeriousViolations(`<main><article role="dialog" aria-modal="true" aria-labelledby="spot-title"><button aria-label="スポット詳細を閉じる">×</button><h2 id="spot-title">博物館</h2><img src="photo.jpg" alt="博物館の写真1"><a href="https://example.test">公式サイトを見る</a></article></main>`)
  })

  it('legal/login primary stateにcritical/serious違反がない', async () => {
    await expectNoSeriousViolations(`<main><article><h1>プライバシーポリシー</h1><h2>取り扱う情報</h2><p>説明</p><a href="mailto:support@example.test">お問い合わせ</a></article><form><h2>管理者ログイン</h2><label for="email">メール</label><input id="email" type="email"><label for="password">パスワード</label><input id="password" type="password"><button>ログイン</button></form></main>`)
  })

  it('self-service onboarding formにcritical/serious違反がない', async () => {
    await expectNoSeriousViolations(`<main><section><h1>組織アカウントを作成</h1><form><label>メールアドレス<input type="email" autocomplete="email"></label><label>パスワード（12文字以上）<input type="password" autocomplete="new-password"></label><label>組織名<input></label><label><input type="checkbox">利用規約に同意します</label><label><input type="checkbox">プライバシーポリシーに同意します</label><button>確認メールを送信</button></form></section></main>`)
  })

  it('主要配色が通常文字AA 4.5:1を満たす', () => {
    expect(contrast('#c7401f', '#ffffff')).toBeGreaterThanOrEqual(4.5)
    expect(contrast('#44403c', '#ffffff')).toBeGreaterThanOrEqual(4.5)
    expect(contrast('#1c1917', '#f5f5f4')).toBeGreaterThanOrEqual(4.5)
  })

})
