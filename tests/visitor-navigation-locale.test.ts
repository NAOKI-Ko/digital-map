// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { MapNavigationControl, syncMapNavigationLabels } from '../app/composables/useMapViewer'

function mockMap() {
  return { on: vi.fn(), off: vi.fn(), getBearing: () => 0, getPitch: () => 25 } as unknown as MapLibreMap
}

describe('visitor navigation locale', () => {
  it('shows an English overview action and accessible controls from the first render', () => {
    const overview = vi.fn()
    const map = mockMap()
    const control = new MapNavigationControl(() => 25, overview, undefined, true, () => 'en')
    const element = control.onAdd(map)
    const button = element.querySelector<HTMLButtonElement>('.map-viewer-overview-control')!
    expect(button.textContent).toBe('All')
    expect(button.title).toBe('Show whole map')
    expect(button.getAttribute('aria-label')).toBe('Show whole map')
    expect(element.querySelector('.map-viewer-zoom-in')?.getAttribute('aria-label')).toBe('Zoom in')
    expect(element.querySelector('.map-viewer-zoom-in')?.classList.contains('map-viewer-zoom-control')).toBe(true)
    expect(element.querySelector('.map-viewer-zoom-out')?.classList.contains('map-viewer-zoom-control')).toBe(true)
    expect(element.querySelector('.map-viewer-compass')?.getAttribute('aria-label')).toBe('Reset heading')
    button.click()
    expect(overview).toHaveBeenCalledOnce()
    control.onRemove(map)
  })

  it('updates text, title and accessible name on locale switch without replacing control DOM', () => {
    const map = mockMap()
    const control = new MapNavigationControl(() => 25, vi.fn(), undefined, true)
    const element = control.onAdd(map)
    const overview = element.querySelector('.map-viewer-overview-control')!
    syncMapNavigationLabels(element, 'en')
    syncMapNavigationLabels(element, 'ja')
    expect(element.querySelector('.map-viewer-overview-control')).toBe(overview)
    expect(overview.textContent).toBe('全体')
    expect(overview.getAttribute('title')).toBe('地図全体を表示')
    expect(overview.getAttribute('aria-label')).toBe('地図全体を表示')
    control.onRemove(map)
  })

  it('keeps existing non-visitor controls unchanged', () => {
    const map = mockMap()
    const control = new MapNavigationControl(() => 20, vi.fn(), undefined, false, () => 'en')
    const element = control.onAdd(map)
    expect(element.querySelector('.map-viewer-overview-control')?.textContent).toBe('□')
    expect(element.querySelector('.map-viewer-zoom-in')?.getAttribute('aria-label')).toBe('拡大')
    control.onRemove(map)
  })
})
