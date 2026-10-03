// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { applyPinVisibility, declutterPins, getCollisionGroup, getCollisionRepresentatives, measurePinRect } from '../app/utils/marker-collision'
const pin = (id: string, priority: number, left = 0, size = 60) => ({ id, priority, rect: { left, top: 0, right: left + size, bottom: size } })
describe('screen-space decluttering', () => {
  it('a chain with two visible winners shows one count without changing visibility or recovery membership', () => {
    const chain = [pin('a', 2, 0), pin('b', 1, 60), pin('c', 1, 120), pin('separate', 1, 300)]
    const visible = declutterPins(chain)
    expect([...visible]).toEqual(['a', 'c', 'separate'])
    expect([...getCollisionRepresentatives(chain, visible)]).toEqual([['a', 3]])
    expect(getCollisionGroup('a', chain).map(pin => pin.id)).toEqual(['a', 'b', 'c'])
    const focused = chain.map(pin => ({ ...pin, protected: pin.id === 'c' }))
    expect([...getCollisionRepresentatives(focused, declutterPins(focused))]).toEqual([['c', 3]])
  })
  it('selected > active Category > featured > normal, independent of input order', () => {
    const pins = [pin('normal',1),pin('featured',2),pin('filter',3),pin('selected',4)]
    expect([...declutterPins(pins)]).toEqual(['selected'])
    expect([...declutterPins(pins.slice(0,3))]).toEqual(['filter'])
    expect([...declutterPins(pins.slice(0,2))]).toEqual(['featured'])
    expect([...declutterPins(pins.reverse())]).toEqual(['selected'])
  })
  it('selected is never removed even if selected candidates overlap', () => {
    expect([...declutterPins([pin('b',4),pin('a',4),pin('z',3)])]).toEqual(['a','b'])
  })
  it('focused PIN survives enlargement and density suppression, while selected remains visible', () => {
    const focused = { ...pin('z-focused', 1, 0, 100), protected: true }
    expect([...declutterPins([pin('a-featured', 2, 80), focused])]).toEqual(['z-focused'])
    expect([...declutterPins([pin('selected', 4), focused])]).toEqual(['selected', 'z-focused'])
    expect([...declutterPins([pin('a-featured', 2, 80), { ...focused, protected: false }])]).toEqual(['a-featured'])
  })
  it('recovers all actual overlaps, even unequal nearby positions and density-hidden candidates', () => {
    const candidates=[pin('selected',4),pin('near',1,.001),pin('edge',2,65),pin('far',1,80)]
    expect(getCollisionGroup('selected',candidates).map(pin=>pin.id).filter(id=>id!=='selected').sort()).toEqual(['edge','far','near'])
    expect(getCollisionGroup('',candidates)).toEqual([])
    expect(getCollisionGroup('missing',candidates)).toEqual([])
  })
  it('ties use stable IDs; touching safety gap is allowed; zoom spacing reveals then suppresses', () => {
    expect([...declutterPins([pin('b',2,69),pin('a',2)])]).toEqual(['a'])
    expect([...declutterPins([pin('b',2,70),pin('a',2)])]).toEqual(['a','b'])
    expect([...declutterPins([pin('b',2,35),pin('a',2)])]).toEqual(['a'])
  })
  it('prefers viewport center in equal priorities, with an eight-pixel winner retention band', () => {
    const a={...pin('a',2),centerDistance:50}, b={...pin('b',2),centerDistance:20}
    expect([...declutterPins([a,b])]).toEqual(['b'])
    expect([...declutterPins([{...a,centerDistance:25},b],10,new Set(['a']))]).toEqual(['a'])
    expect([...declutterPins([{...a,centerDistance:30},b],10,new Set(['a']))]).toEqual(['b'])
    expect([...declutterPins([a,{...b,priority:1}])]).toEqual(['a'])
  })
  it('larger actual artwork suppresses more neighbors without mutating canonical candidates', () => {
    const pins=[pin('a',2,0,80),pin('b',1,75)]
    const before=JSON.stringify(pins)
    expect([...declutterPins(pins)]).toEqual(['a'])
    expect(JSON.stringify(pins)).toBe(before)
    const element=document.createElement('button'), child=document.createElement('span')
    child.className='map-viewer-marker__illustration';element.append(child)
    element.getBoundingClientRect=()=>({left:0,top:0,right:60,bottom:60} as DOMRect)
    child.getBoundingClientRect=()=>({left:-50,top:-20,right:100,bottom:60} as DOMRect)
    expect(measurePinRect(element)).toEqual({left:-50,top:-20,right:100,bottom:60})
  })
  it('hidden geometry stays measurable, loses focus and cannot receive keyboard/scripted focus', () => {
    const region=document.createElement('div');region.setAttribute('role','region');region.tabIndex=0
    const element=document.createElement('button');region.append(element);document.body.append(region);element.focus()
    applyPinVisibility(element,false)
    expect(element.style.visibility).toBe('hidden');expect(element.hidden).toBe(false)
    expect(element.inert).toBe(true);expect(element.tabIndex).toBe(-1);expect(document.activeElement).not.toBe(element)
    applyPinVisibility(element,true)
    expect(element.inert).toBe(false);expect(element.tabIndex).toBe(0);expect(element.getAttribute('aria-hidden')).toBe('false')
    region.remove()
  })
})
