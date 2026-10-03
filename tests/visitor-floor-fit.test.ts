// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { useMapCamera } from '../app/composables/useMapCamera'
import { calculateVisitorFitPadding, type FitRect } from '../app/utils/visitor-floor-fit'
import { getFloorCorners } from '../lib/geo'
import type { MapViewerFloor } from '../shared/types/map-viewer'

const rect = (width: number, height: number, top = 0, left = 0): FitRect => ({ width, height, top, left, right: left + width, bottom: top + height })
describe('visitor viewport safe fit', () => {
  it.each([[390,844],[768,968],[1024,712],[1440,844],[1440,644],[390,200]])('uses actual chrome and leaves a nonempty rectangle at %s×%s', (width,height) => {
    const viewport=rect(width,height,56)
    const p=calculateVisitorFitPadding(viewport,[{edge:'top',rect:rect(100,44,68)},{edge:'bottom',rect:rect(width-24,52,height-20)}])
    expect(width-p.left-p.right).toBeGreaterThanOrEqual(80)
    expect(height-p.top-p.bottom).toBeGreaterThanOrEqual(79.99)
    if(height>300) { expect(p.top).toBe(68); expect(p.bottom).toBe(88) }
  })
  it('ignores hidden chrome and handles safe area offsets rather than window height', () => {
    expect(calculateVisitorFitPadding(rect(390,700,100),[{edge:'top',rect:rect(100,44,142)},{edge:'bottom',rect:rect(0,0)}])).toEqual({top:98,bottom:24,left:24,right:24})
  })
  it.each([[], [{ x: 2, y: .5 }], [{ x: 0, y: 0 }, { x: 1, y: 1 }]])('fallback content %j uses 0/25 discovery while Overview retains computed level fit', (spots) => {
    const floor = ref({ id: 'fallback', imageWidth: 1280, imageHeight: 640 } as MapViewerFloor)
    const container = ref({ clientWidth: 390, clientHeight: 844, closest: () => null, getBoundingClientRect: () => rect(390,844) } as unknown as HTMLElement)
    const instance = { stop: vi.fn(), resize: vi.fn(), getZoom: () => 14, getMaxZoom: () => 23, setMinZoom: vi.fn(), setMaxZoom: vi.fn(), cameraForBounds: vi.fn(() => ({ center: [0,0], zoom: 14 })), jumpTo: vi.fn() }
    const camera = useMapCamera(container, ref(instance as unknown as MapLibreMap), { mode: 'view', floor, spots: ref(spots as import('../shared/types/map-viewer').MapViewerSpot[]), isReady: ref(true), visitorOverview: ref(true) })
    const eventHomePitches: number[] = []
    instance.jumpTo.mockImplementation(() => { eventHomePitches.push(camera.getHomePitch()) })
    camera.fitFloorBounds(getFloorCorners(floor.value)!, false)
    expect(eventHomePitches.every(pitch => pitch === 25)).toBe(true)
    expect(instance.cameraForBounds).toHaveBeenCalledOnce()
    expect(instance.cameraForBounds).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ pitch: 0 }))
    expect(instance.jumpTo).toHaveBeenLastCalledWith({ center: [0,0], zoom: 15.15, bearing: 0, pitch: 25 })
    expect(camera.getHomePitch()).toBe(25)
    // At the md boundary, the border leaves a 766px canvas inside a 768px stage.
    container.value = { ...container.value, clientWidth: 766, closest: () => ({ clientWidth: 768, querySelectorAll: () => [] }) } as unknown as HTMLElement
    camera.fitFloorBounds(getFloorCorners(floor.value)!, false)
    expect(instance.jumpTo).toHaveBeenLastCalledWith({ center: [0,0], zoom: 14.2, bearing: 0, pitch: 25 })
  })
  it('new Floor cancels old motion, resets heading, measures padding and fits its own bounds; passive resize never refits', () => {
    const floor=ref({id:'a',imageWidth:1280,imageHeight:1280} as MapViewerFloor)
    const container=ref({clientWidth:390,clientHeight:844,closest:()=>null,getBoundingClientRect:()=>rect(390,844)} as unknown as HTMLElement)
    let zoom=14
    const instance={stop:vi.fn(),resize:vi.fn(),getCenter:()=>({lng:0,lat:0}),getZoom:()=>zoom,getMaxZoom:()=>23,getBearing:()=>70,getPitch:()=>45,setMinZoom:vi.fn(),setMaxZoom:vi.fn(),cameraForBounds:vi.fn(()=>({center:[0,0],zoom:14})),jumpTo:vi.fn((c)=>{if(c.zoom)zoom=c.zoom}),easeTo:vi.fn()}
    const camera=useMapCamera(container,ref(instance as unknown as MapLibreMap),{mode:'view',floor,isReady:ref(true),visitorOverview:ref(true)})
    camera.fitFloorBounds(getFloorCorners(floor.value)!,true)
    expect(instance.stop).toHaveBeenCalledOnce()
    expect(instance.cameraForBounds).toHaveBeenCalledWith(expect.anything(),expect.objectContaining({bearing:0,pitch:0,padding:{top:24,bottom:24,left:24,right:24}}))
    expect(instance.jumpTo).toHaveBeenLastCalledWith({center:[0,0],zoom:15.15,bearing:0,pitch:25})
    camera.showWholeFloor()
    expect(camera.getHomePitch()).toBe(0)
    expect(instance.easeTo).toHaveBeenLastCalledWith(expect.objectContaining({zoom:14,bearing:0,pitch:0}))
    instance.easeTo.mockClear()
    instance.jumpTo.mockClear(); instance.cameraForBounds.mockClear(); zoom=16
    camera.resize()
    expect(instance.cameraForBounds).not.toHaveBeenCalled()
    expect(instance.jumpTo).not.toHaveBeenCalled()
    expect(instance.easeTo).not.toHaveBeenCalled()
    floor.value={...floor.value,id:'wide',imageWidth:2560,imageHeight:640}
    camera.fitFloorBounds(getFloorCorners(floor.value)!,true)
    expect(instance.stop).toHaveBeenCalledTimes(2)
    expect(instance.jumpTo).toHaveBeenLastCalledWith({center:[0,0],zoom:15.15,bearing:0,pitch:25})
  })
})
