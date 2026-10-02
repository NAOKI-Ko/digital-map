// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useMapCollisionRecovery } from '../app/composables/useMapCollisionRecovery'
import { spiderfyLayout } from '../app/utils/map-spiderfy'
import type { MapViewerSpot } from '../shared/types/map-viewer'
import type { Map as MapLibreMap } from 'maplibre-gl'

function setup(exact = true, reduced = false) {
  const frame=document.createElement('div'), canvas=document.createElement('canvas')
  canvas.tabIndex=0; frame.append(canvas); document.body.append(frame)
  Object.defineProperty(frame,'clientWidth',{value:390}); Object.defineProperty(frame,'clientHeight',{value:844})
  let zoom=1
  const events=new Map<string,()=>void>()
  const spots=Object.freeze([0,1,2].map(i=>Object.freeze({id:`spot-${i}`,name:`Spot ${i}`,x:.5+(exact?0:i*.000001),y:.5,importance:'featured',pinSize:'medium',pinIconType:'preset',pinIconId:'shop',pinColor:'#123456',categories:[]}))) as unknown as MapViewerSpot[]
  const candidates=spots.map(spot=>({id:spot.id,priority:2,rect:{left:150,top:200,right:210,bottom:260}}))
  const select=vi.fn(), refresh=vi.fn(), started=vi.fn()
  const easeTo=vi.fn((camera:{zoom:number})=>{ recovery.onMotion(); zoom=camera.zoom; const done=events.get('moveend'); events.delete('moveend'); done?.() })
  const map={getZoom:()=>zoom,getMaxZoom:()=>10,getCanvas:()=>canvas,project:(position:number[])=>({x:195+position[0]!*100,y:422}),easeTo,
    once:(name:string,handler:()=>void)=>events.set(name,handler),off:(name:string)=>events.delete(name)} as unknown as MapLibreMap
  Object.defineProperty(window,'matchMedia',{configurable:true,value:()=>({matches:reduced})})
  const recovery=useMapCollisionRecovery({map:()=>map,frame:()=>frame,candidates:()=>candidates,spots:()=>spots,position:spot=>({lng:spot.x!,lat:spot.y!}),select,refresh,onStarted:started})
  return {frame,canvas,spots,select,refresh,started,recovery,easeTo}
}
beforeEach(()=>vi.useFakeTimers())
afterEach(()=>{vi.useRealTimers();document.body.innerHTML=''})
describe('Map-only recovery contract',()=>{
  it('spreads exact-coordinate PINs, reaches every Spot with native keyboard/click and never mutates canonical data',()=>{
    const t=setup();const before=JSON.stringify(t.spots)
    t.recovery.activate(t.spots[0]!)
    const pins=[...t.frame.querySelectorAll<HTMLButtonElement>('[data-spiderfied]')]
    expect(t.started).toHaveBeenCalledOnce();expect(pins).toHaveLength(3);expect(document.activeElement).toBe(pins[0]);expect(pins.every(pin=>pin.tabIndex===0&&!pin.inert)).toBe(true)
    pins[2]!.click();expect(t.select).toHaveBeenCalledWith(t.spots[2]);expect(t.recovery.isOpen()).toBe(false)
    expect(JSON.stringify(t.spots)).toBe(before)
  })
  it('Escape and motion close the spread and recover Map focus',()=>{
    const t=setup();t.recovery.activate(t.spots[0]!)
    const event=new KeyboardEvent('keydown',{key:'Escape',cancelable:true})
    t.recovery.onKey(event);expect(event.defaultPrevented).toBe(true);expect(document.activeElement).toBe(t.canvas)
    t.recovery.activate(t.spots[1]!);t.recovery.onMotion();expect(t.recovery.isOpen()).toBe(false)
  })
  it('tries smooth Map zoom first, then spreads near-coordinate members only at maximum zoom',async()=>{
    const t=setup(false);t.recovery.activate(t.spots[0]!)
    expect(t.easeTo).toHaveBeenCalledWith(expect.objectContaining({zoom:10,duration:400}))
    expect(t.recovery.isOpen()).toBe(false)
    await vi.advanceTimersByTimeAsync(100)
    expect(t.recovery.isOpen()).toBe(true);expect(t.select).not.toHaveBeenCalled()
  })
  it('cancels pending recovery after another motion or context change; honors reduced motion',async()=>{
    const t=setup(false,true);t.recovery.activate(t.spots[0]!)
    expect(t.easeTo).toHaveBeenCalledWith(expect.objectContaining({duration:0}))
    t.recovery.onMotion();await vi.advanceTimersByTimeAsync(100);expect(t.recovery.isOpen()).toBe(false)
    t.recovery.activate(t.spots[0]!);t.recovery.close();expect(t.recovery.isOpen()).toBe(false)
  })
  it('bounds small spreads and offers scrolling instead of clipping large groups',()=>{
    const small=spiderfyLayout(3,{x:5,y:5},390,844)
    expect(small.left).toBeGreaterThanOrEqual(16);expect(small.top).toBeGreaterThanOrEqual(60)
    expect(small.left+small.width).toBeLessThanOrEqual(374)
    const large=spiderfyLayout(100,{x:195,y:422},390,844)
    expect(large.contentHeight).toBeGreaterThan(large.height);expect(large.points).toHaveLength(100)
  })
})
