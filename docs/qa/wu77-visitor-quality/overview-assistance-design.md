# BB003 / BB004 overview assistance — source review snapshot

This batch follows the immutable bacbf691 visual polish candidate. It has not been installed in Windows or checked in a browser. It does not claim that BB003/BB004 quality findings are closed.

## BB003: one recommendation after a larger viewport

The visitor MapViewer adds a read-only ResizeObserver. After the map and floor illustration are ready, it compares the public-map-stage dimensions against the ready baseline. The stage width avoids treating a 768px stage's 766px bordered canvas as mobile. The recommendation requires width at least 768px, height at least 300px, width growth at least 160px and 35%, and area growth at least 30%. The 390→430→768→1024→1440 sequence yields one recommendation at 768px. Cold loading, Detail, Floor/Info modal state, floor changes, and height-only or small changes rebase or do not trigger. Modal suppression resets the ready baseline and clears the new recommendation; it does not consume its one-shot allowance or change the ordinary operation hint timer. The policy announces at most once per mounted viewer.

Only a color and inset ring emphasize the existing Overview control; width, height, padding and reserved fit regions are unchanged. Keyboard focus retains amber with a white inner separation on the dark emphasis surface, matching the Category focus treatment. The existing operation hint displays `全体で画面に合わせられます` once for its existing duration, above the category band. Recommendation state does not call any camera operation. The native Overview click retains its ordinary interaction/context recovery and existing showWholeFloor implementation.

The camera and painted map occupancy remain unchanged until an explicit Overview action. An assistance prompt alone cannot raise the resized map's paint occupancy score. Independent product QA/PDM must judge whether this assistance addresses the reported friction.

## BB004: one explicit facility shortcut in the existing mobile row

Only one existing category whose every member placement has an explicit supported facility preset qualifies, and it must contain every explicitly supported facility placement on that floor. An uncategorized facility or one only in a different mixed category suppresses the shortcut; no subset is described as all equipment. The helper evaluates all memberships on the selected floor. Mixed categories, unknown/legacy IDs, custom/illustration appearances, no category and multiple qualifying categories produce no shortcut. Names are never classification evidence. The current fixture qualifies `wu77-cat-3` on both floors with 12 and 6 placements respectively.

`設備を全体で見る` is a fixed 44px button inside the existing mobile CategoryFilter options row, outside the chip scroller. It is hidden at md, while loading, when its category is already selected, and whenever the existing category dock is hidden for Detail or a modal. It preserves the current row height, heading, 52px desktop band and sentinel. No extra overlay or fit edge is added. Available horizontal chip space becomes narrower; the existing pager, fades and keyboard focus scrolling remain available without reordering categories.

An explicit shortcut click appends the category to existing OR selections. It then waits for Vue rendering, one animation frame, actual dock measurement and another Vue render to update the existing fit sentinel and controls. It finally focuses the existing native Overview button with preventScroll and invokes its click, preserving the original showWholeFloor path. Floor/category/Detail/modal/readiness changes during that wait cancel the fit. This focus transfer prevents keyboard focus from remaining on the disappearing shortcut; it is not a marker-selection change.

## Preserved contracts

No camera calculation or fit utility, marker geometry or 60px target, priority, category order, Detail native focus return, data model, publication or authorization changes. Read-only resize guidance never calls camera operations. Explicit facility Overview uses the existing Category OR and existing Whole control. Formal gates and independent browser QA must assess these promises and the outstanding quality findings.

Independent QA still needs: fresh 390/430 readiness and row height/fit-padding/initial-camera equality; no recommendation on cold desktop, Detail or height-only changes; ready 390→430→768/1024/1440 camera equality until explicit Overview; control dimensions before/after emphasis; 1F/2F shortcut counts, existing OR selections, last chip/pager and keyboard access; native Overview focus; near/coincident non-representative Detail→Escape/close focus; mixed/legacy floors without a shortcut; reduced motion; and the final Map-first quality rubric.
