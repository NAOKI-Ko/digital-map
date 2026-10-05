/** The single trailing control pages forward, then returns directly to the start. */
export function nextCategoryScrollLeft(scroller: Pick<HTMLElement, 'scrollLeft' | 'clientWidth' | 'scrollWidth'>, canForward: boolean) {
  return canForward
    ? Math.min(scroller.scrollWidth - scroller.clientWidth, scroller.scrollLeft + Math.max(120, scroller.clientWidth * .8))
    : 0
}
