import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const picker = readFileSync(new URL('../app/components/admin/MediaPicker.vue', import.meta.url), 'utf8')
const consumers = [
  '../app/pages/admin/maps/[mapId]/floors.vue',
  '../app/components/admin/SpotPhotoManager.vue',
  '../app/components/admin/CategoryIconEditor.vue',
  '../app/components/admin/PinDesignEditor.vue',
  '../app/pages/admin/maps/[mapId]/settings.vue',
].map(path => readFileSync(new URL(path, import.meta.url), 'utf8'))

describe('共通Media Picker', () => {
  it('新規uploadと登録済み画像の両方を提供する', () => {
    expect(picker).toContain('新規アップロード')
    expect(picker).toContain('登録済み画像から選ぶ')
    expect(picker).toContain("emit('selected', image)")
    expect(picker).toContain('await refresh()')
  })

  it('最近使用・このMAP・すべて・用途filterを提供する', () => {
    expect(picker).toContain("id: 'recent'")
    expect(picker).toContain("id: 'map'")
    expect(picker).toContain("id: 'all'")
    expect(picker).toContain('用途フィルター')
    expect(picker).toContain("const usageFilter = ref<UsageFilter>(props.usage)")
    expect(picker).toContain('すべての用途')
  })

  it('Phase 1の既存画像consumerが同じpickerを使う', () => {
    for (const source of consumers) expect(source).toContain('<MediaPicker')
  })

  it('選択結果はURLだけでなくassetIdをconsumerへ渡す', () => {
    expect(consumers.join('\n')).toMatch(/AssetId\s*=\s*image\.assetId|assetId:\s*image\.assetId/)
  })

  it('uploadとLibrary選択を同じpreview stateへ正規化する', () => {
    expect(picker).toContain("selected.value = image")
    expect(picker).toContain('selectedPreviewUrl')
    expect(picker).toContain('画像を変更')
    expect(picker).not.toContain('画像を選択済み:')
  })

  it('consumerごとの用途defaultを宣言し、SEO画像も既存usage metadataを使う', () => {
    expect(consumers[0]).toContain('usage="floor"')
    expect(consumers[1]).toContain('usage="photo"')
    expect(consumers[2]).toContain('usage="category"')
    expect(consumers[3]).toContain('usage="pin"')
    expect(consumers[4]).toContain('usage="logo"')
    expect(consumers[4]).toContain('usage="seo"')
    expect(picker).toContain("seo: 'mapSeoImages'")
  })

  it('Spot写真detachはrelationだけを更新し物理削除APIを呼ばない', () => {
    const photos = consumers[1]!
    expect(photos).toContain('写真をスポットの登録から外します')
    expect(photos).not.toContain('/api/media/')
  })
})
