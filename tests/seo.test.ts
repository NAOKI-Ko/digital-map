import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildLocaleLinks, buildPublicLocaleUrl } from '../shared/utils/seo'

describe('SEO / OGP', () => {
  it('ja URLを維持し、en canonicalを英語variantへ分離する', () => {
    expect(buildPublicLocaleUrl('https://maps.example/', 'town-map', 'ja')).toBe('https://maps.example/town-map')
    expect(buildPublicLocaleUrl('https://maps.example', 'town-map', 'en')).toBe('https://maps.example/town-map?lang=en')
    expect(buildLocaleLinks('https://maps.example', 'town-map', 'en', ['ja', 'en'])).toEqual(expect.arrayContaining([
      { rel: 'canonical', href: 'https://maps.example/town-map?lang=en' },
      { rel: 'alternate', hreflang: 'ja', href: 'https://maps.example/town-map' },
      { rel: 'alternate', hreflang: 'en', href: 'https://maps.example/town-map?lang=en' },
      { rel: 'alternate', hreflang: 'x-default', href: 'https://maps.example/town-map' },
    ]))
  })

  it('public metadataはSnapshotのseo値だけを使い、未取得時noindexにする', () => {
    const page = readFileSync(new URL('../app/pages/[mapSlug]/index.vue', import.meta.url), 'utf8')
    expect(page).toContain('data.value?.map.seo.title')
    expect(page).toContain("'noindex,nofollow'")
    expect(page).toContain('ogTitle')
    expect(page).toContain('twitterCard')
    expect(page).not.toContain('prisma')
  })

  it('Snapshot build sourceはoverrideとlocale fallback、代表Mediaを含む', () => {
    const source = readFileSync(new URL('../server/utils/public-map.ts', import.meta.url), 'utf8')
    expect(source).toContain('record.seoTitle || localizedName')
    expect(source).toContain('record.seoDescription || localizedDescription')
    expect(source).toContain("optimizedUrl(record.seoImageAsset, 'spot-photo'")
  })

  it('sitemapはpublished current releaseだけを対象にしlocale alternatesを出す', () => {
    const source = readFileSync(new URL('../server/routes/sitemap.xml.get.ts', import.meta.url), 'utf8')
    expect(source).toContain('isPublished: true')
    expect(source).toContain('currentReleaseId: { not: null }')
    expect(source).toContain('hreflang="x-default"')
    expect(source).toContain('max-age=300')
  })

  it('SEO設定APIはOWNER/assigned Map EDITOR境界とTenant Mediaを検証する', () => {
    const source = readFileSync(new URL('../server/api/maps/[mapId]/seo/index.patch.ts', import.meta.url), 'utf8')
    expect(source).toContain('requireMapAccess(event)')
    expect(source).toContain('resolveTenantMediaAsset(map.tenantId')
  })
})
