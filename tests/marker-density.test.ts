import { describe, expect, it } from 'vitest'
import {
  applyMarkerDensityPresentation,
  FEATURED_SPOT_SCALE,
  getMarkerDensityPresentation,
  NORMAL_SPOT_MIN_OPACITY,
  NORMAL_SPOT_MIN_SCALE,
} from '../app/utils/marker-density'

describe('公開Mapの意味的PIN密度', () => {
  it('通常Spotは最小zoomでも消さず、小さく薄く表示する', () => {
    expect(getMarkerDensityPresentation('normal', 14.5, 14.5)).toEqual({
      opacity: NORMAL_SPOT_MIN_OPACITY,
      scale: NORMAL_SPOT_MIN_SCALE,
      priority: 1,
    })
  })

  it('通常Spotは2段階のzoom範囲で連続的に通常表示へ戻る', () => {
    expect(getMarkerDensityPresentation('normal', 15.5, 14.5)).toMatchObject({ opacity: 0.675, scale: 0.89 })
    expect(getMarkerDensityPresentation('normal', 16.5, 14.5)).toEqual({ opacity: 1, scale: 1, priority: 1 })
  })

  it('注目Spotはzoomにかかわらず優先サイズと不透明度を保つ', () => {
    expect(getMarkerDensityPresentation('featured', 14.5, 14.5)).toEqual({ opacity: 1, scale: FEATURED_SPOT_SCALE, priority: 2 })
  })

  it('選択中Spotは重要度にかかわらず完全表示する', () => {
    expect(getMarkerDensityPresentation('normal', 14.5, 14.5, true)).toEqual({ opacity: 1, scale: 1, priority: 3 })
  })

  it('MapLibreが管理するmarker本体opacityを避けてCSS変数へ反映する', () => {
    const properties = new Map<string, string>()
    const element = {
      style: {
        opacity: '',
        zIndex: '',
        setProperty: (name: string, value: string) => properties.set(name, value),
      },
    } as unknown as HTMLElement

    applyMarkerDensityPresentation(element, { opacity: 0.35, scale: 0.78, priority: 1 })

    expect(element.style.opacity).toBe('')
    expect(properties.get('--marker-density-opacity')).toBe('0.350')
    expect(properties.get('--marker-density-scale')).toBe('0.780')
  })
})
