import { computed, onBeforeUnmount, ref, type Ref } from 'vue'

export type BottomSheetState = 'detail' | 'expanded'
export type BottomSheetGestureSource = 'header' | 'body'
export type BottomSheetGestureOutcome = 'close' | 'expand' | 'reset'

const DIRECTION_THRESHOLD_PX = 8
const VERTICAL_RATIO = 1.25
const CLOSE_DISTANCE_PX = 80
const CLOSE_FLICK_DISTANCE_PX = 24
const CLOSE_FLICK_VELOCITY_PX_MS = 0.5
const EXPAND_DISTANCE_PX = 64
const VELOCITY_WINDOW_MS = 80

export function isInteractiveGestureTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('a,button,input,select,textarea,video,[role="button"],[data-sheet-no-drag]'))
}

export function isVerticalSheetGesture(dx: number, dy: number) {
  return Math.hypot(dx, dy) >= DIRECTION_THRESHOLD_PX && Math.abs(dy) > VERTICAL_RATIO * Math.abs(dx)
}

export function getBottomSheetGestureOutcome(input: {
  source: BottomSheetGestureSource
  state: BottomSheetState
  dx: number
  dy: number
  velocityY: number
}): BottomSheetGestureOutcome {
  if (!isVerticalSheetGesture(input.dx, input.dy)) return 'reset'
  if (input.dy >= CLOSE_DISTANCE_PX) return 'close'
  if (input.dy >= CLOSE_FLICK_DISTANCE_PX && input.velocityY >= CLOSE_FLICK_VELOCITY_PX_MS) return 'close'
  if (input.source === 'header' && input.state === 'detail' && -input.dy >= EXPAND_DISTANCE_PX) return 'expand'
  return 'reset'
}

interface GestureSample {
  time: number
  y: number
}

interface ActiveGesture {
  source: BottomSheetGestureSource
  startX: number
  startY: number
  lastX: number
  lastY: number
  direction: 'pending' | 'vertical' | 'rejected'
  samples: GestureSample[]
}

export function useBottomSheetGesture(options: {
  state: Readonly<Ref<BottomSheetState>>
  onClose: () => void
  onExpand: () => void
}) {
  const translateY = ref(0)
  const dragging = ref(false)
  const settling = ref(false)
  let active: ActiveGesture | null = null
  let activePointerId: number | null = null
  let closeTimer: number | null = null

  const style = computed(() => ({
    transform: `translate3d(0, ${translateY.value}px, 0)`,
    transitionDuration: dragging.value ? '0ms' : 'var(--sheet-motion-duration, 180ms)',
  }))

  function clearCloseTimer() {
    if (closeTimer !== null) window.clearTimeout(closeTimer)
    closeTimer = null
  }

  function resetGesture() {
    active = null
    activePointerId = null
    dragging.value = false
    settling.value = true
    translateY.value = 0
    window.requestAnimationFrame(() => { settling.value = false })
  }

  function cancelGesture() {
    resetGesture()
  }

  function startGesture(source: BottomSheetGestureSource, x: number, y: number, time: number) {
    clearCloseTimer()
    active = {
      source,
      startX: x,
      startY: y,
      lastX: x,
      lastY: y,
      direction: 'pending',
      samples: [{ time, y }],
    }
    translateY.value = 0
  }

  function moveGesture(x: number, y: number, time: number) {
    if (!active) return false
    const dx = x - active.startX
    const dy = y - active.startY
    active.lastX = x
    active.lastY = y

    if (active.direction === 'pending' && Math.hypot(dx, dy) >= DIRECTION_THRESHOLD_PX) {
      active.direction = Math.abs(dy) > VERTICAL_RATIO * Math.abs(dx) ? 'vertical' : 'rejected'
    }
    if (active.direction === 'rejected') return false
    if (active.direction !== 'vertical') return false
    if (active.source === 'body' && dy <= 0) {
      active.direction = 'rejected'
      return false
    }

    dragging.value = true
    translateY.value = active.source === 'header' && options.state.value === 'detail'
      ? Math.max(-EXPAND_DISTANCE_PX, dy)
      : Math.max(0, dy)
    active.samples.push({ time, y })
    active.samples = active.samples.filter(sample => time - sample.time <= VELOCITY_WINDOW_MS)
    return true
  }

  function finishGesture() {
    if (!active) return
    const gesture = active
    const last = gesture.samples.at(-1)
    const sampleTime = last?.time ?? performance.now()
    const firstRecent = gesture.samples.find(sample => sampleTime - sample.time <= VELOCITY_WINDOW_MS) ?? gesture.samples[0]
    const velocityY = firstRecent && last && last.time > firstRecent.time
      ? Math.max(0, (last.y - firstRecent.y) / (last.time - firstRecent.time))
      : 0
    const outcome = getBottomSheetGestureOutcome({
      source: gesture.source,
      state: options.state.value,
      dx: gesture.lastX - gesture.startX,
      dy: gesture.lastY - gesture.startY,
      velocityY,
    })
    active = null
    activePointerId = null
    dragging.value = false

    if (outcome === 'close') {
      settling.value = true
      translateY.value = Math.max(window.innerHeight, 800)
      closeTimer = window.setTimeout(() => {
        closeTimer = null
        options.onClose()
      }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180)
      return
    }
    if (outcome === 'expand') options.onExpand()
    settling.value = true
    translateY.value = 0
    window.requestAnimationFrame(() => { settling.value = false })
  }

  function onHeaderPointerDown(event: PointerEvent) {
    if (!event.isPrimary || isInteractiveGestureTarget(event.target)) {
      if (!event.isPrimary) cancelGesture()
      return
    }
    activePointerId = event.pointerId
    startGesture('header', event.clientX, event.clientY, event.timeStamp)
    ;(event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId)
  }

  function onHeaderPointerMove(event: PointerEvent) {
    if (event.pointerId !== activePointerId) return
    moveGesture(event.clientX, event.clientY, event.timeStamp)
  }

  function onHeaderPointerUp(event: PointerEvent) {
    if (event.pointerId !== activePointerId) return
    moveGesture(event.clientX, event.clientY, event.timeStamp)
    finishGesture()
  }

  function onHeaderPointerCancel(event: PointerEvent) {
    if (event.pointerId === activePointerId) cancelGesture()
  }

  function onBodyTouchStart(event: TouchEvent) {
    if (event.touches.length !== 1 || isInteractiveGestureTarget(event.target)) {
      cancelGesture()
      return
    }
    const body = event.currentTarget as HTMLElement | null
    if (!body || body.scrollTop > 1) return
    const touch = event.touches[0]
    if (touch) startGesture('body', touch.clientX, touch.clientY, event.timeStamp)
  }

  function onBodyTouchMove(event: TouchEvent) {
    if (!active || active.source !== 'body') return
    if (event.touches.length !== 1) {
      cancelGesture()
      return
    }
    const touch = event.touches[0]
    if (touch && moveGesture(touch.clientX, touch.clientY, event.timeStamp) && event.cancelable) event.preventDefault()
  }

  function onBodyTouchEnd(event: TouchEvent) {
    if (!active || active.source !== 'body') return
    const touch = event.changedTouches[0]
    if (touch) moveGesture(touch.clientX, touch.clientY, event.timeStamp)
    finishGesture()
  }

  function onBodyTouchCancel() {
    cancelGesture()
  }

  onBeforeUnmount(clearCloseTimer)

  return {
    dragging,
    settling,
    style,
    cancelGesture,
    onHeaderPointerDown,
    onHeaderPointerMove,
    onHeaderPointerUp,
    onHeaderPointerCancel,
    onBodyTouchStart,
    onBodyTouchMove,
    onBodyTouchEnd,
    onBodyTouchCancel,
  }
}
