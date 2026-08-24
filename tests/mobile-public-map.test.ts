import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const publicPage = readFileSync(new URL('../app/pages/[mapSlug]/index.vue', import.meta.url), 'utf8')
const detailCard = readFileSync(new URL('../app/components/map/SpotDetailCard.vue', import.meta.url), 'utf8')

describe('モバイル公開Map UI', () => {
  it('Categoryを片手操作しやすい下部へ置き、選択中sheetとの重なりを避ける', () => {
    expect(publicPage).toContain("bottom-[max(1rem,env(safe-area-inset-bottom))]")
    expect(publicPage).toContain("bottom-[calc(8.75rem+env(safe-area-inset-bottom))]")
  })

  it('Bottom Sheetはcollapsed/expandedを持ちsafe areaへ対応する', () => {
    expect(detailCard).toContain("const expanded = ref(false)")
    expect(detailCard).toContain(':aria-expanded="expanded"')
    expect(detailCard).toContain('env(safe-area-inset-bottom)')
  })

  it('mobile backdropはmap gestureを奪わずsheet本体だけ操作可能にする', () => {
    expect(detailCard).toContain('pointer-events-none fixed inset-0')
    expect(detailCard).toContain('pointer-events-auto w-full')
    expect(detailCard).toContain('sm:pointer-events-auto')
  })
})
