import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const layout = readFileSync('app/layouts/admin.vue', 'utf8')
const navigation = readFileSync('app/components/admin/AdminNavigation.vue', 'utf8')
const subnavigation = readFileSync('app/components/admin/AdminSubnavigation.vue', 'utf8')
const viewer = readFileSync('app/composables/useMapViewer.ts', 'utf8')
const georeference = readFileSync('app/components/admin/GeoReferenceWizard.vue', 'utf8')
const home = readFileSync('app/pages/admin/maps/[mapId]/index.vue', 'utf8')
const publish = readFileSync('app/pages/admin/maps/[mapId]/publish.vue', 'utf8')

describe('WU-41 admin shell contracts', () => {
  it('collapsed stateだけをpresentation preferenceとして保存する', () => {
    expect(layout).toContain("localStorage.setItem('adminSidebarExpanded'")
    expect(layout).not.toMatch(/localStorage\.setItem\([^)]*(?:role|permission|mapId|tenantId)/i)
    expect(navigation).toContain("await navigateTo('/admin/dashboard')")
    expect(navigation).toContain("await navigateTo(`/admin/maps/${mapId}`)")
  })

  it('rail tooltip/current semanticsとmobile dialog keyboard behaviorを持つ', () => {
    expect(navigation).toContain('admin-nav-tooltip')
    expect(navigation).toContain(':aria-current="isActive(item) ? \'page\' : undefined"')
    expect(layout).toContain('aria-modal="true"')
    expect(layout).toContain("event.key === 'Escape'")
    expect(layout).toContain("event.key !== 'Tab'")
    expect(layout).toContain('menuTrigger.value?.focus()')
    expect(layout).toContain(':inert="isNavigationOpen || undefined"')
  })

  it('subnavigationはlinksとaria-currentを使い、fake tabを使わない', () => {
    expect(subnavigation).toContain('<NuxtLink')
    expect(subnavigation).toContain('aria-current')
    expect(subnavigation).not.toContain('role="tab"')
  })

  it('MapLibre surfacesはshell eventとcontainer resizeの両方に追従する', () => {
    for (const source of [viewer, georeference]) {
      expect(source).toContain("admin-sidebar-resize")
      expect(source).toContain('ResizeObserver')
      expect(source).toContain('.resize()')
    }
  })

  it('公開CTAはsummaryのusable URLに限定し、PDFはPublish内に残る', () => {
    expect(home).toContain('v-if="data.map.publicUrl"')
    expect(home).not.toContain('未公開変更')
    expect(publish).toContain('<PaperExportPanel')
  })
})

