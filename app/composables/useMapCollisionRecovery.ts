import type { Map as MapLibreMap } from 'maplibre-gl'
import type { MapViewerSpot } from '~~/shared/types/map-viewer'
import { createSpotMarkerElement } from '~/utils/marker-element'
import { applyPinVisibility, getCollisionGroup, type CollisionCandidate } from '~/utils/marker-collision'
import { PIN_SIZE_SCALES } from '~/utils/marker-density'
import { spiderfyLayout } from '~/utils/map-spiderfy'

interface RecoveryOptions {
  map: () => MapLibreMap | null
  frame: () => HTMLElement | null
  candidates: () => readonly CollisionCandidate[]
  spots: () => readonly MapViewerSpot[]
  position: (spot: MapViewerSpot) => { lng: number, lat: number } | null
  select: (spot: MapViewerSpot) => void
  visitor?: () => boolean
  onStarted?: () => void
  refresh: () => void
}

/** Transient Map presentation. It never writes Spot or publication data. */
export function useMapCollisionRecovery(options: RecoveryOptions) {
  let overlay: HTMLElement | null = null
  let pending: string | null = null
  let pendingMap: MapLibreMap | null = null
  let generation = 0
  let ownZoomStart = false
  let memberIds = new Set<string>()
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function finishZoom() {
    const token = generation
    const id = pending
    pending = null
    pendingMap = null
    // Wait for projected marker layout/collision geometry at the completed camera.
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      if (token === generation && id && options.map() && options.candidates().some(pin => pin.id === id)) {
        const group = getCollisionGroup(id, options.candidates())
        if (group.length > 1 && options.map()!.getZoom() >= options.map()!.getMaxZoom() - .01) open(group)
      }
    }))
  }

  function close(restoreFocus = false) {
    generation++
    ownZoomStart = false
    pendingMap?.off('moveend', finishZoom)
    pendingMap = null
    pending = null
    const hadFocus = Boolean(overlay?.contains(document.activeElement))
    overlay?.remove()
    overlay = null
    memberIds.clear()
    if (restoreFocus || hadFocus) options.map()?.getCanvas().focus({ preventScroll: true })
    options.refresh()
  }

  function open(group: readonly CollisionCandidate[]) {
    close()
    const frame = options.frame(), map = options.map()
    if (!frame || !map) return
    const spots = options.spots().filter(spot => group.some(pin => pin.id === spot.id)).sort((a,b) => a.id.localeCompare(b.id))
    if (spots.length < 2) return
    const centers = spots.flatMap(spot => { const position = options.position(spot); return position ? [map.project([position.lng, position.lat])] : [] })
    if (!centers.length) return
    const center = { x: centers.reduce((sum,p) => sum+p.x,0)/centers.length, y: centers.reduce((sum,p) => sum+p.y,0)/centers.length }
    const size = Math.max(76, ...group.map(pin => Math.max(pin.rect.right-pin.rect.left, pin.rect.bottom-pin.rect.top)+16))
    const layout = spiderfyLayout(spots.length, center, frame.clientWidth, frame.clientHeight, size)
    overlay = document.createElement('div')
    overlay.className = 'map-viewer-spiderfy'
    overlay.dataset.spiderfy = 'open'
    overlay.setAttribute('role','group')
    overlay.setAttribute('aria-label','重なったスポットのピン')
    overlay.style.cssText = `position:absolute;z-index:40;left:${layout.left}px;top:${layout.top}px;width:${layout.width}px;height:${layout.height}px;overflow:auto;border-radius:16px;background:${layout.contentHeight>layout.height?'rgba(255,255,255,.94)':'transparent'};overscroll-behavior:contain`
    // MapLibre handles mouse/touch events as well as pointer events. Keep spread
    // scrolling and PIN taps from starting a map drag/pinch gesture.
    for (const name of ['pointerdown','mousedown','touchstart','touchmove','touchend']) {
      overlay.addEventListener(name, event => event.stopPropagation())
    }
    overlay.addEventListener('wheel', event => event.stopPropagation())
    const content = document.createElement('div')
    content.style.cssText = `position:relative;width:${layout.width}px;height:${layout.contentHeight}px`
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg')
    svg.setAttribute('width',String(layout.width)); svg.setAttribute('height',String(layout.contentHeight))
    svg.style.cssText = 'position:absolute;pointer-events:none'
    content.append(svg)
    spots.forEach((spot,index) => {
      const point = layout.points[index]!
      const line = document.createElementNS(svg.namespaceURI,'line')
      line.setAttribute('x1',String(layout.width/2)); line.setAttribute('y1',String(layout.contentHeight/2))
      line.setAttribute('x2',String(point.x)); line.setAttribute('y2',String(point.y)); line.setAttribute('stroke','#78716c')
      svg.append(line)
      const pin = createSpotMarkerElement(spot, { mode:'view', visitor:options.visitor?.(), selected:false, onSelected:() => { close(true); options.select(spot) } })
      pin.classList.add('maplibregl-marker')
      pin.dataset.spiderfied = 'true'
      pin.style.left = `${point.x}px`; pin.style.top = `${point.y}px`
      pin.style.transform = 'translate(-50%,-100%)'
      pin.style.setProperty('--marker-size-scale',String(PIN_SIZE_SCALES[spot.pinSize ?? 'medium']))
      applyPinVisibility(pin,true)
      content.append(pin)
      memberIds.add(spot.id)
    })
    overlay.append(content)
    frame.append(overlay)
    overlay.querySelector<HTMLElement>('button')?.focus({ preventScroll:true })
    options.refresh()
  }

  function activate(spot: MapViewerSpot) {
    const map = options.map()
    if (!map) return
    close()
    const group = getCollisionGroup(spot.id, options.candidates())
    if (group.length < 2) { options.select(spot); return }
    options.onStarted?.()
    const members = options.spots().filter(item => group.some(pin => pin.id === item.id))
    const positions = members.flatMap(item => { const p = options.position(item); return p ? [p] : [] })
    if (!positions.length) return
    const exact = positions.every(p => p.lng === positions[0]!.lng && p.lat === positions[0]!.lat)
    if (exact || map.getZoom() >= map.getMaxZoom() - .01) { open(group); return }
    // Unwrap longitudes around the first member for groups crossing the date line.
    const origin = positions[0]!.lng
    const lng = positions.reduce((sum,p) => sum + origin + ((p.lng-origin+540)%360)-180,0)/positions.length
    const lat = positions.reduce((sum,p) => sum+p.lat,0)/positions.length
    const projected = positions.map(p => map.project([p.lng,p.lat]))
    const maxSpread = Math.max(...projected.map(p => Math.hypot(p.x-projected[0]!.x,p.y-projected[0]!.y))) * 2 ** (map.getMaxZoom()-map.getZoom())
    const targetZoom = maxSpread < 44 ? map.getMaxZoom() : Math.min(map.getMaxZoom(),map.getZoom()+1)
    pending = spot.id
    pendingMap = map
    map.once('moveend',finishZoom)
    ownZoomStart = true
    map.easeTo({ center:[lng,lat], zoom:targetZoom, duration:reducedMotion()?0:400 })
  }

  function onMotion() {
    // A recovery zoom owns its moveend; every other pan/zoom invalidates the spread.
    if (ownZoomStart) { ownZoomStart = false; return }
    if (overlay || pending) close()
    else generation++
  }
  function onKey(event: KeyboardEvent) {
    if (event.key === 'Escape' && overlay) { event.preventDefault(); event.stopPropagation(); close(true) }
  }
  return { activate, close, onMotion, onKey, isOpen:()=>Boolean(overlay), hasMember:(id:string)=>memberIds.has(id) }
}
