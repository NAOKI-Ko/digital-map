import { createWu68Fixture } from '../__qa_wu68/index.get'
// Development-only visitor artwork fixture; no persisted Map/Spot changes.
export default defineEventHandler(() => {
  const response = createWu68Fixture()
  response.map.name = 'WU-70 artwork geometry'
  const floor = response.map.floors[0]!
  const sample = floor.spots[0]!
  const image = (w: number, h: number) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" rx="4" fill="#186c70"/><circle cx="${w/2}" cy="${h/2}" r="${Math.min(w,h)*.3}" fill="#fff0aa"/></svg>`)}`
  floor.spots = [
    { id:'pair-a',name:'Normal A',x:.35,y:.23,pinSize:'medium',importance:'normal' },
    { id:'pair-b',name:'Normal B',x:.44,y:.23,pinSize:'medium',importance:'normal' },
    { id:'small',name:'Small featured',x:.2,y:.43,pinSize:'small',importance:'featured' },
    { id:'medium',name:'Medium custom',x:.5,y:.43,pinSize:'medium',importance:'normal',pinIconType:'custom',pinIconImageUrl:image(48,48) },
    { id:'large',name:'Large custom',x:.8,y:.43,pinSize:'large',importance:'normal',pinIconType:'custom',pinIconImageUrl:image(48,48) },
    { id:'wide',name:'Wide illustration',x:.35,y:.7,pinSize:'small',importance:'normal',pinIconType:'illustration',pinIconImageUrl:image(240,40) },
    { id:'tall',name:'Tall illustration',x:.75,y:.7,pinSize:'large',importance:'featured',pinIconType:'illustration',pinIconImageUrl:image(30,90) },
    { id:'pair-a2',name:'Coincident A',x:.35,y:.23,pinSize:'medium',importance:'normal' },
  ].map(spot => ({ ...structuredClone(sample), pinIconType:'preset', pinIconImageUrl:null, photos:[], ...spot })) as typeof floor.spots
  return response
})
