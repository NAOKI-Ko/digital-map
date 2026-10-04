export type FloorImageState = 'loading' | 'loaded' | 'error'
interface ImageSourceEvents {
  on(type: 'data' | 'error', listener: () => void): unknown
}

/** Ignore late events from a removed/retried floor, including a same-ID replacement. */
export function monitorFloorImage(source: ImageSourceEvents, isCurrent: () => boolean, update: (state: FloorImageState) => void) {
  update('loading')
  let failed = false
  source.on('data', () => {
    if (isCurrent() && !failed) update('loaded')
  })
  source.on('error', () => {
    if (!isCurrent()) return
    failed = true
    update('error')
  })
}
