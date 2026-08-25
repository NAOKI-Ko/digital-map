import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const newSpotPage = readFileSync(new URL('../app/pages/admin/maps/[mapId]/spots/new.vue', import.meta.url), 'utf8')
const editSpotPage = readFileSync(new URL('../app/pages/admin/maps/[mapId]/spots/[spotId].vue', import.meta.url), 'utf8')

describe('SpotForm hydration boundary', () => {
  it.each([
    ['new', newSpotPage],
    ['edit', editSpotPage],
  ])('%s page renders SpotForm inside ClientOnly with a fallback', (_label, source) => {
    const clientOnlyStart = source.indexOf('<ClientOnly>')
    const spotForm = source.indexOf('<SpotForm', clientOnlyStart)
    const clientOnlyEnd = source.indexOf('</ClientOnly>', spotForm)

    expect(clientOnlyStart).toBeGreaterThanOrEqual(0)
    expect(spotForm).toBeGreaterThan(clientOnlyStart)
    expect(clientOnlyEnd).toBeGreaterThan(spotForm)
    expect(source.slice(clientOnlyStart, clientOnlyEnd)).toContain('<template #fallback>')
    expect(source.slice(clientOnlyStart, clientOnlyEnd)).toContain('フォームを読み込んでいます…')
  })
})
