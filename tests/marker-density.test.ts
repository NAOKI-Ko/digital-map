import { describe, expect, it } from 'vitest'
import { applyMarkerDensityPresentation, getMarkerDensityPresentation, PIN_SIZE_SCALES } from '../app/utils/marker-density'

describe('公開MapのPIN優先度・サイズ・密度', () => {
  it('farではnormalを離散的に非表示にしfeaturedを残す', () => {
    expect(getMarkerDensityPresentation('normal', 'medium', 14.5, 14.5).visible).toBe(false)
    expect(getMarkerDensityPresentation('featured', 'medium', 14.5, 14.5)).toMatchObject({ visible: true, priority: 2 })
  })

  it('nearではnormalも表示する', () => {
    expect(getMarkerDensityPresentation('normal', 'medium', 16, 14.5)).toEqual({ visible: true, scale: 1, priority: 1 })
  })

  it('selectedとCategory filter matchはnormal抑制を回避する', () => {
    expect(getMarkerDensityPresentation('normal', 'small', 14.5, 14.5, true)).toEqual({ visible: true, scale: PIN_SIZE_SCALES.small, priority: 4 })
    expect(getMarkerDensityPresentation('normal', 'small', 14.5, 14.5, false, true)).toEqual({ visible: true, scale: PIN_SIZE_SCALES.small, priority: 3 })
  })

  it('importanceと表示サイズを独立して扱う', () => {
    expect(getMarkerDensityPresentation('featured', 'small', 14.5, 14.5).scale).toBe(0.8)
    expect(getMarkerDensityPresentation('normal', 'large', 20, 14.5).scale).toBe(1.25)
  })

  it('opacity fadingではなくhiddenとサイズ変数を設定する', () => {
    const properties = new Map<string, string>()
    const element = { hidden: false, style: { opacity: '', zIndex: '', setProperty: (name: string, value: string) => properties.set(name, value) } } as unknown as HTMLElement
    applyMarkerDensityPresentation(element, { visible: false, scale: 0.8, priority: 1 })
    expect(element.hidden).toBe(true)
    expect(element.style.opacity).toBe('')
    expect(properties.get('--marker-size-scale')).toBe('0.800')
  })
})
