import { describe, expect, it } from 'vitest'
import { mapVisibilityLabel, paperSourceExplanation, paperSourceLabel, releaseSourceLabel } from '../app/utils/admin-publication-copy'
import { resolveSpotListReturnTo } from '../app/utils/admin-return-context'

describe('Admin publication language', () => {
  it('distinguishes editable, visitor-visible, and retained Paper sources', () => {
    expect(mapVisibilityLabel(true)).toBe('公開中')
    expect(mapVisibilityLabel(false)).toBe('非公開')
    expect(paperSourceLabel('LIVE', true)).toBe('編集中の内容')
    expect(paperSourceLabel('LIVE', false)).toBe('編集中の内容')
    expect(paperSourceLabel('PUBLISHED', true)).toBe('公開中の内容')
    expect(paperSourceLabel('PUBLISHED', false)).toBe('前回公開した内容')
    expect(releaseSourceLabel(false)).not.toBe('公開中の内容')
    expect(paperSourceExplanation('PUBLISHED', false)).toContain('非公開')
  })
})

describe('Spot list return context', () => {
  const mapId = 'map-a'
  const parent = `/admin/maps/${mapId}/spots`

  it('keeps recognized same-Map filters and direct-link fallback', () => {
    expect(resolveSpotListReturnTo(mapId, `${parent}?q=coffee&status=published&sort=name`)).toBe(`${parent}?q=coffee&status=published&sort=name`)
    expect(resolveSpotListReturnTo(mapId, undefined)).toBe(parent)
  })

  it.each([
    'https://evil.example/admin/maps/map-a/spots',
    '//evil.example/admin/maps/map-a/spots',
    '/admin/maps/map-b/spots?q=coffee',
    '/admin/maps/map-a/spots/other',
    '/admin/maps/map-a/spots?status=unknown',
    '/admin/maps/map-a/spots?returnTo=https://evil.example',
  ])('rejects an unrecognized return target: %s', (value) => {
    expect(resolveSpotListReturnTo(mapId, value)).toBe(parent)
  })
})
