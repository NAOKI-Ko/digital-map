// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { declutterPins, getCollisionGroup, getCollisionRepresentatives, measurePinRect, measurePinVisualRect, pinArtworkBounds, VISITOR_PIN_COLLISION_GAP } from '../app/utils/marker-collision'
import { artworkTarget, bindVisitorMarkerInteraction } from '../app/utils/marker-interaction'
const rect = (left: number, top: number, width: number, height = width) => ({ left, top, right:left+width, bottom:top+height, width, height } as DOMRect)
function marker(x=0, scale=1, type='shape') {
  const el=document.createElement('button'), art=document.createElement('span')
  el.className='map-viewer-marker';el.dataset.pinVisible='true'
  art.className='map-viewer-marker__'+type;el.append(art)
  el.getBoundingClientRect=()=>rect(x-30,-60,60)
  art.getBoundingClientRect=()=>rect(x-20*Math.SQRT2*scale,-40*Math.SQRT2*scale,40*Math.SQRT2*scale)
  Object.defineProperty(art,'offsetWidth',{value:40,configurable:true})
  return {el,art}
}
describe('visitor visual geometry separated from interaction targets',()=>{
  it.each([.8,1,1.25,1.08,1.25*1.08])('measures the painted shell at scale %s, not its transparent rotated corners',scale=>{
    const {el}=marker(0,scale), r=measurePinVisualRect(el)
    expect(r.right-r.left).toBeCloseTo(40*scale)
    expect(r.bottom-r.top).toBeCloseTo((20+20*Math.SQRT2)*scale)
    expect(el.getBoundingClientRect().width).toBe(60)
    expect(r.bottom).toBe(0)
  })
  it('shows separated artwork despite overlapping 60px hit targets; same geometry drives badge and recovery',()=>{
    const a=marker(),b=marker(43)
    const candidates=[a,b].map((p,i)=>({id:String(i),priority:1,rect:measurePinVisualRect(p.el)}))
    expect(declutterPins(candidates,VISITOR_PIN_COLLISION_GAP).size).toBe(2)
    expect(getCollisionRepresentatives(candidates,new Set(['0','1']),VISITOR_PIN_COLLISION_GAP).size).toBe(0)
    expect(getCollisionGroup('0',candidates,VISITOR_PIN_COLLISION_GAP)).toHaveLength(1)
    expect(declutterPins([a,b].map((p,i)=>({id:String(i),priority:1,rect:measurePinRect(p.el)}))).size).toBe(1)
    candidates[1]!.rect=measurePinVisualRect(marker(39).el)
    expect(declutterPins(candidates,VISITOR_PIN_COLLISION_GAP).size).toBe(1)
    expect(getCollisionRepresentatives(candidates,new Set(['0']),VISITOR_PIN_COLLISION_GAP).get('0')).toBe(2)
    expect(getCollisionGroup('0',candidates,VISITOR_PIN_COLLISION_GAP)).toHaveLength(2)
  })
  it('adds transformed selection outline and measured featured decoration but not labels or badges',()=>{
    const {el,art}=marker(0,1.08); el.classList.add('map-viewer-marker--selected')
    const normal=pinArtworkBounds(art.getBoundingClientRect())
    expect(measurePinVisualRect(el).left).toBeCloseTo(normal.left-4*1.08)
    const feature=document.createElement('span');feature.className='map-viewer-marker__featured'
    feature.getBoundingClientRect=()=>rect(25,-50,10);el.append(feature)
    const badge=document.createElement('span');badge.className='map-viewer-marker__collision-badge'
    badge.getBoundingClientRect=()=>rect(-100,-100,200);el.append(badge)
    expect(measurePinVisualRect(el).right).toBe(35)
    expect(measurePinVisualRect(el).top).toBeCloseTo(normal.top-4*1.08)
  })
  it('uses illustration aspect ratio inside object-fit:contain and preserves selected outline bounds',()=>{
    const {el,art}=marker(0,1,'illustration');art.getBoundingClientRect=()=>rect(-80,-48,160,48)
    Object.defineProperty(art,'offsetWidth',{value:160,configurable:true})
    const image=document.createElement('img');image.getBoundingClientRect=art.getBoundingClientRect
    Object.defineProperties(image,{naturalWidth:{value:240},naturalHeight:{value:40,configurable:true}});art.append(image)
    const r=measurePinVisualRect(el);expect(r.right-r.left).toBe(160);expect(r.bottom-r.top).toBeCloseTo(160/6)
    el.classList.add('map-viewer-marker--selected')
    expect(measurePinVisualRect(el)).toEqual({left:-84,right:84,top:-52,bottom:4})
  })
  it('a retained hitbox inside the viewport cannot suppress a PIN when its artwork is outside',()=>{
    const a=marker(-21),b=marker(18)
    const candidates=[a,b].map((p,i)=>({id:String(i),priority:1,rect:measurePinVisualRect(p.el)}))
    expect([...declutterPins(candidates,0,new Set(['0']),{left:0,top:-100,right:390,bottom:844})]).toEqual(['1'])
  })
})
describe('overlapping visitor hit targets',()=>{
  it('routes pointer taps to visible artwork before native focus changes geometry; keyboard keeps native target',()=>{
    const scope=document.createElement('div'),a=marker(),b=marker(43);scope.append(a.el,b.el)
    const onA=vi.fn(),onB=vi.fn();bindVisitorMarkerInteraction(a.el,onA);bindVisitorMarkerInteraction(b.el,onB)
    expect(artworkTarget(b.el,18,-28)).toBe(a.el)
    b.el.dispatchEvent(new PointerEvent('pointerdown',{clientX:18,clientY:-28}))
    a.el.dataset.pinVisible='false' // native focus can schedule a collision pass before click
    b.el.dispatchEvent(new MouseEvent('click',{detail:1,clientX:18,clientY:-28}))
    expect(onA).toHaveBeenCalledTimes(1);expect(onB).not.toHaveBeenCalled()
    b.el.dispatchEvent(new MouseEvent('click',{detail:0}))
    expect(onB).toHaveBeenCalledTimes(1)
  })
  it('routes a sibling badge intercepted by transparent padding to its recovery owner',()=>{
    const scope=document.createElement('div'),a=marker(),b=marker(43);scope.append(a.el,b.el)
    const badge=document.createElement('span');badge.className='map-viewer-marker__collision-badge';badge.getBoundingClientRect=()=>rect(10,-60,20);a.el.append(badge)
    expect(artworkTarget(b.el,18,-55)).toBe(a.el)
    const onA=vi.fn(),onB=vi.fn();bindVisitorMarkerInteraction(a.el,onA);bindVisitorMarkerInteraction(b.el,onB)
    b.el.dispatchEvent(new PointerEvent('pointerdown',{clientX:18,clientY:-55}))
    b.el.dispatchEvent(new MouseEvent('click',{detail:1,clientX:18,clientY:-55}))
    expect(onA).toHaveBeenCalledTimes(1);expect(onB).not.toHaveBeenCalled()
  })
  it('keeps foreground artwork ahead of an obscured sibling badge',()=>{
    const scope=document.createElement('div'),a=marker(),b=marker(43);scope.append(a.el,b.el)
    a.el.style.zIndex='1';b.el.style.zIndex='2'
    const badge=document.createElement('span');badge.className='map-viewer-marker__collision-badge';badge.getBoundingClientRect=()=>rect(10,-60,20);a.el.append(badge)
    expect(artworkTarget(b.el,28,-41)).toBe(b.el)
    expect(artworkTarget(b.el,18,-55)).toBe(a.el)
  })
  it('retains padding taps, collision badge ownership, and excludes hidden PINs',()=>{
    const scope=document.createElement('div'),a=marker(),b=marker(43);scope.append(a.el,b.el)
    expect(artworkTarget(b.el,65,-55)).toBe(b.el)
    a.el.dataset.pinVisible='false';expect(artworkTarget(b.el,18,-28)).toBe(b.el);a.el.dataset.pinVisible='true'
    const badge=document.createElement('span');badge.className='map-viewer-marker__collision-badge';badge.getBoundingClientRect=()=>rect(10,-35,20);b.el.append(badge)
    expect(artworkTarget(b.el,18,-28)).toBe(b.el)
    badge.hidden=true;expect(artworkTarget(b.el,18,-28)).toBe(a.el)
  })
})
