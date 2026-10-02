import { describe, expect, it } from 'vitest'
import { clampVisitorInitialZoom, getVisitorContentBounds } from '../app/utils/visitor-initial-camera'
import type { MapViewerFloor, MapViewerSpot } from '../shared/types/map-viewer'
const floor={imageWidth:1000,imageHeight:800} as MapViewerFloor
const spot=(x:number,y:number)=>({x,y} as MapViewerSpot)
describe('visitor initial content framing',()=>{
  it('bounds use content padding, handle single/identical Spots and convert through floor geometry',()=>{
    const compact=getVisitorContentBounds(floor,[spot(.4,.4),spot(.6,.6)])!
    const single=getVisitorContentBounds(floor,[spot(.5,.5)])!
    expect(compact[1][0]-compact[0][0]).toBeGreaterThan(single[1][0]-single[0][0])
    expect(single[1][0]-single[0][0]).toBeGreaterThan(0)
  })
  it('empty/invalid/outside/extreme content falls back; input is untouched',()=>{
    for(const spots of [[],[spot(NaN,.5)],[spot(-.1,.5)],[spot(0,0),spot(1,1)]])expect(getVisitorContentBounds(floor,spots)).toBeNull()
    const spots=[spot(.4,.4)];const before=JSON.stringify(spots);getVisitorContentBounds(floor,spots);expect(JSON.stringify(spots)).toBe(before)
  })
  it('zoom never exceeds whole-floor + .65, handles huge/single content and invalid camera',()=>{
    expect(clampVisitorInitialZoom(14,24)).toBe(14.65)
    expect(clampVisitorInitialZoom(14,14.4)).toBe(14.55)
    expect(clampVisitorInitialZoom(14,13)).toBe(14.55)
    expect(clampVisitorInitialZoom(14,NaN)).toBe(14)
  })
})
