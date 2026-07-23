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

const baseSpot: MapViewerSpot = {
  id: 'spot-1',
  name: 'テストスポット',
  category: '観光',
  lat: 35,
  lng: 139,
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
  it('presetは独立した接地影と雫型の文字アイコンを返す', () => {
    const marker = createElement()
    const [shadow, shape] = marker.children

    expect(marker.classList.contains('map-viewer-marker--illustration')).toBe(false)
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
