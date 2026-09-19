import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('WCAG implementation source contract', () => {
  it('実装にkeyboard marker、focus trap/return、decorative image semanticsがある', () => {
    const marker = readFileSync(join(process.cwd(), 'app/utils/marker-element.ts'), 'utf8')
    const page = readFileSync(join(process.cwd(), 'app/pages/[mapSlug]/index.vue'), 'utf8')
    const dialog = readFileSync(join(process.cwd(), 'app/components/map/SpotDetailCard.vue'), 'utf8')
    const map = readFileSync(join(process.cwd(), 'app/composables/useMapViewer.ts'), 'utf8')
    expect(marker).toContain("createElement('button')")
    expect(marker).toContain("image.alt = ''")
    expect(page).not.toContain('SpotAccessibleList')
    expect(page).toContain('closingTrigger?.isConnected ? closingTrigger : fallbackMarker ?? mapEntry')
    expect(page).toContain("querySelectorAll<HTMLElement>('.map-viewer-marker[data-spot-id]')")
    expect(marker).toContain("element.setAttribute('data-spot-id', spot.id)")
    expect(dialog).toContain('<DialogRoot')
    expect(dialog).toContain('<DialogContent')
    expect(dialog).toContain('<DialogTitle')
    expect(dialog).toContain('data-spot-detail-title')
    expect(dialog).not.toContain(':id="`spot-detail-title-')
    expect(dialog).toContain('@open-auto-focus="focusHeading"')
    expect(dialog).toContain('@close-auto-focus="preventAutomaticCloseFocus"')
    expect(dialog).toContain('@pointer-down-outside="handlePointerDismiss"')
    expect(map).toContain("button.setAttribute('aria-label', label)")
  })

  it('public以外のlegal/login/onboardingページにも既定のdocument languageがある', () => {
    const config = readFileSync(join(process.cwd(), 'nuxt.config.ts'), 'utf8')
    expect(config).toMatch(/htmlAttrs:\s*\{\s*lang:\s*'ja'/)
  })
})
