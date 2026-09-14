import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { createSpotMarkerElement } from '../app/utils/marker-element'
import type { MapViewerSpot } from '../shared/types/map-viewer'

class FakeStyle {
  readonly properties = new Map<string, string>()

  setProperty(name: string, value: string) {
    this.properties.set(name, value)
  }
}

class FakeElement {
  readonly attributes = new Map<string, string>()
  readonly children: FakeElement[] = []
  readonly style = new FakeStyle()
  private readonly classes = new Set<string>()
  type = ''
  title = ''
  src = ''
  alt = ''
  textContent: string | null = null

  constructor(readonly tagName: string) {}

  get className() {
    return [...this.classes].join(' ')
  }

  set className(value: string) {
    this.classes.clear()
    value.split(/\s+/).filter(Boolean).forEach(name => this.classes.add(name))
  }

  readonly classList = {
    toggle: (name: string, force?: boolean) => {
      const enabled = force ?? !this.classes.has(name)
      if (enabled) this.classes.add(name)
      else this.classes.delete(name)
      return enabled
    },
    contains: (name: string) => this.classes.has(name),
  }

  append(...children: FakeElement[]) {
    this.children.push(...children)
  }

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value)
  }

  addEventListener() {}
}

const fakeDocument = {
  createElement(tagName: string) {
    return new FakeElement(tagName.toUpperCase())
  },
}

const mapViewerSource = readFileSync(
  new URL('../app/components/map/MapViewer.vue', import.meta.url),
  'utf8',
)
const pinDesignEditorSource = readFileSync(
  new URL('../app/components/admin/PinDesignEditor.vue', import.meta.url),
  'utf8',
)
const spotPublishPanelSource = readFileSync(
  new URL('../app/components/admin/SpotPublishPanel.vue', import.meta.url),
  'utf8',
)

function cssRule(source: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return source.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`))?.[1] ?? ''
}

function remValue(rule: string, property: string) {
  return Number(rule.match(new RegExp(`${property}:\\s*([\\d.]+)rem;`))?.[1])
}

const baseSpot: MapViewerSpot = {
  id: 'spot-1',
  name: 'テストスポット',
  categories: [{ id: 'category-1', name: '観光', order: 0 }],
  importance: 'normal',
  x: 0.5,
  y: 0.5,
  pinIconType: 'preset',
  pinIconId: 'sightseeing',
  pinIconImageUrl: null,
  pinColor: '#C7401F',
}

function createElement(overrides: Partial<MapViewerSpot> = {}) {
  return createSpotMarkerElement(
    { ...baseSpot, ...overrides },
    { mode: 'view', selected: false, onSelected: vi.fn() },
    fakeDocument as unknown as Pick<Document, 'createElement'>,
  ) as unknown as FakeElement
}

describe('Marker DOM生成', () => {
  it.each([
    ['normal', 'preset', null, 'map-viewer-marker__shape'],
    ['normal', 'custom', '/uploads/custom.png', 'map-viewer-marker__shape'],
    ['normal', 'illustration', '/uploads/illustration.png', 'map-viewer-marker__illustration'],
    ['featured', 'preset', null, 'map-viewer-marker__shape'],
    ['featured', 'custom', '/uploads/custom.png', 'map-viewer-marker__shape'],
    ['featured', 'illustration', '/uploads/illustration.png', 'map-viewer-marker__illustration'],
  ] as const)('%s / %sはMapLibre rootとscale対象visualを分離する', (importance, pinIconType, pinIconImageUrl, visualClass) => {
    const marker = createElement({ importance, pinIconType, pinIconImageUrl })

    expect(marker.attributes.get('data-marker-contact')).toBe('bottom-center')
    expect(marker.style.properties.has('transform')).toBe(false)
    expect(marker.children[1]?.className).toBe(visualClass)
  })

  it('scale対象visualはbottom接点をtransform-originにする', () => {
    expect(mapViewerSource).toMatch(/\.map-viewer-marker__shape\s*\{[\s\S]*?transform-origin:\s*bottom left;/)
    expect(mapViewerSource).toMatch(/\.map-viewer-marker__illustration\s*\{[\s\S]*?transform-origin:\s*bottom center;/)
  })

  it('focus return用のstable Spot identityをmarkerへ付与する', () => {
    expect(createElement().attributes.get('data-spot-id')).toBe('spot-1')
  })

  it('編集時は移動対象だけをドラッグ可能として読み上げる', () => {
    const selectable = createSpotMarkerElement(baseSpot, { mode: 'edit', selected: false }, fakeDocument as unknown as Pick<Document, 'createElement'>) as unknown as FakeElement
    const draggable = createSpotMarkerElement(baseSpot, { mode: 'edit', selected: true, draggable: true }, fakeDocument as unknown as Pick<Document, 'createElement'>) as unknown as FakeElement

    expect(selectable.attributes.get('aria-label')).toBe('テストスポットを選択')
    expect(draggable.attributes.get('aria-label')).toBe('テストスポットをドラッグして位置調整')
  })

  it('presetとcustomは外形を広げず内部contentが本体幅の75%以上を使う', () => {
    const shapeRule = cssRule(mapViewerSource, '.map-viewer-marker__shape')
    const contentRule = cssRule(mapViewerSource, '.map-viewer-marker__content')
    const shapeWidth = remValue(shapeRule, 'width')
    const contentWidth = remValue(contentRule, 'width')

    expect(contentWidth / shapeWidth).toBeGreaterThanOrEqual(0.75)
    expect(remValue(contentRule, 'height')).toBe(contentWidth)
    expect(contentRule).toMatch(/object-fit:\s*cover;/)
    expect(contentRule).toMatch(/object-position:\s*center;/)
  })

  it('管理画面のcustom previewも共通content classで内部領域を広げる', () => {
    const pinDesignShapeWidth = remValue(cssRule(pinDesignEditorSource, '.pin-design-preview'), 'width')
    const pinDesignContentWidth = remValue(cssRule(pinDesignEditorSource, '.pin-design-preview__content'), 'width')
    const publishShapeWidth = remValue(cssRule(spotPublishPanelSource, '.spot-preview-pin'), 'width')
    const publishContentWidth = remValue(cssRule(spotPublishPanelSource, '.spot-preview-pin__content'), 'width')

    expect(pinDesignEditorSource).toContain('class="pin-design-preview__content pin-design-preview__content--custom"')
    expect(spotPublishPanelSource).toContain('class="spot-preview-pin__content spot-preview-pin__content--custom"')
    expect(pinDesignContentWidth / pinDesignShapeWidth).toBeGreaterThanOrEqual(0.75)
    expect(publishContentWidth / publishShapeWidth).toBeGreaterThanOrEqual(0.75)
    expect(cssRule(pinDesignEditorSource, '.pin-design-preview__content--custom')).toMatch(/object-fit:\s*cover;/)
    expect(cssRule(spotPublishPanelSource, '.spot-preview-pin__content--custom')).toMatch(/object-fit:\s*cover;/)
  })

  it('重要度をデザイン方式と独立した属性として付与する', () => {
    const marker = createElement({ importance: 'featured', pinIconType: 'illustration', pinIconImageUrl: '/pin.png' })

    expect(marker.classList.contains('map-viewer-marker--featured')).toBe(true)
    expect(marker.attributes.get('data-spot-importance')).toBe('featured')
  })

  it('presetは独立した接地影と雫型の文字アイコンを返す', () => {
    const marker = createElement()
    const [shadow, shape] = marker.children

    expect(marker.classList.contains('map-viewer-marker--illustration')).toBe(false)
    expect(marker.attributes.get('data-marker-contact')).toBe('bottom-center')
    expect(shadow?.className).toBe('map-viewer-marker__ground-shadow')
    expect(shape?.className).toBe('map-viewer-marker__shape')
    expect(shape?.children[0]).toMatchObject({
      tagName: 'SPAN',
      className: 'map-viewer-marker__content',
      textContent: '観',
    })
  })

  it('kanji接頭辞は文字アイコンとして表示する', () => {
    const marker = createElement({ pinIconId: 'kanji:観' })
    const content = marker.children[1]?.children[0]

    expect(content).toMatchObject({
      tagName: 'SPAN',
      className: 'map-viewer-marker__content',
      textContent: '観',
    })
    expect(content?.classList.contains('material-symbols-outlined')).toBe(false)
  })

  it('material接頭辞はMaterial Symbolsのグリフとして表示する', () => {
    const marker = createElement({ pinIconId: 'material:restaurant' })
    const content = marker.children[1]?.children[0]

    expect(content).toMatchObject({
      tagName: 'SPAN',
      className: 'map-viewer-marker__content map-viewer-marker__content--material material-symbols-outlined',
      textContent: 'restaurant',
    })
    expect(content?.classList.contains('material-symbols-outlined')).toBe(true)
  })

  it('接頭辞なしの既存IDは文字アイコンへフォールバックする', () => {
    const marker = createElement({ pinIconId: 'sightseeing' })
    const content = marker.children[1]?.children[0]

    expect(content).toMatchObject({
      className: 'map-viewer-marker__content',
      textContent: '観',
    })
  })

  it('customは雫型の中に登録画像を返す', () => {
    const marker = createElement({
      pinIconType: 'custom',
      pinIconImageUrl: '/uploads/custom.png',
    })
    const shape = marker.children[1]

    expect(shape?.className).toBe('map-viewer-marker__shape')
    expect(shape?.children[0]).toMatchObject({
      tagName: 'IMG',
      className: 'map-viewer-marker__content',
      src: '/uploads/custom.png',
      alt: '',
    })
  })

  it('illustrationは雫型を作らず、独立した接地影と比率維持用画像を返す', () => {
    const marker = createElement({
      pinIconType: 'illustration',
      pinIconImageUrl: '/uploads/illustration.png',
    })
    const [shadow, illustration] = marker.children

    expect(marker.classList.contains('map-viewer-marker--illustration')).toBe(true)
    expect(marker.attributes.get('data-marker-contact')).toBe('bottom-center')
    expect(shadow?.className).toBe('map-viewer-marker__ground-shadow')
    expect(illustration?.className).toBe('map-viewer-marker__illustration')
    expect(illustration?.children[0]).toMatchObject({
      tagName: 'IMG',
      className: 'map-viewer-marker__illustration-image',
      src: '/uploads/illustration.png',
      alt: '',
    })
    expect(marker.children.some(child => child.className === 'map-viewer-marker__shape')).toBe(false)
  })
})
