import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const editorSource = readFileSync(new URL('../app/pages/admin/maps/[mapId]/editor.vue', import.meta.url), 'utf8')

const toolbarTag = editorSource.match(/<div data-pin-editor-toolbar[^>]*>/)?.[0] ?? ''
const workspaceTag = editorSource.match(/<div data-pin-editor-workspace[^>]*>/)?.[0] ?? ''
const mapSectionTag = editorSource.match(/<section class="[^"]*" aria-label="地図操作">/)?.[0] ?? ''

describe('WU-56 PIN editor sticky Map', () => {
  it('Map sectionだけをlg以上でstickyにし、安定した上端オフセットとgrid伸長対策を持つ', () => {
    expect(mapSectionTag).toContain('lg:sticky')
    expect(mapSectionTag).toContain('lg:top-6')
    expect(mapSectionTag).toContain('lg:self-start')
    expect(mapSectionTag).not.toMatch(/(?:^|\s)sticky(?:\s|$)/)
  })

  it('toolbarとworkspace全体はstickyにしない', () => {
    expect(toolbarTag).not.toContain('sticky')
    expect(workspaceTag).not.toContain('sticky')
    expect(editorSource.indexOf('data-pin-editor-toolbar')).toBeLessThan(editorSource.indexOf('data-pin-editor-workspace'))
  })

  it('Map高さを維持し、scrollイベントによるsticky代替を導入しない', () => {
    expect(editorSource).toContain('height="min(68vh, 46rem)"')
    expect(editorSource).not.toMatch(/addEventListener\(\s*['"]scroll['"]/)
    expect(editorSource).not.toContain('window.scrollY')
  })
})
