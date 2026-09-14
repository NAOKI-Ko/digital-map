import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('WCAG implementation source contract', () => {
  it('実装にkeyboard marker、list alternative、focus trap/return、decorative image semanticsがある', () => {
    const marker = readFileSync(join(process.cwd(), 'app/utils/marker-element.ts'), 'utf8')
    const page = readFileSync(join(process.cwd(), 'app/pages/[mapSlug]/index.vue'), 'utf8')
    const dialog = readFileSync(join(process.cwd(), 'app/components/map/SpotDetailCard.vue'), 'utf8')
    const map = readFileSync(join(process.cwd(), 'app/composables/useMapViewer.ts'), 'utf8')
    expect(marker).toContain("createElement('button')")
    expect(marker).toContain("image.alt = ''")
    expect(page).toContain('SpotAccessibleList')
    expect(page).toContain('spotTrigger?.isConnected ? spotTrigger : fallback')
    expect(page).toContain("querySelectorAll<HTMLElement>('.map-viewer-marker[data-spot-id]')")
    expect(marker).toContain("element.setAttribute('data-spot-id', spot.id)")
    expect(dialog).toContain('aria-modal="true"')
    expect(dialog).toContain("event.key !== 'Tab'")
    expect(map).toContain("button.setAttribute('aria-label', label)")
  })
})
