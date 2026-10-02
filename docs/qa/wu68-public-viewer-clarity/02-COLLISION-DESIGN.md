# Collision design
Existing DOM Marker anchors remain bottom-center. All markers retain their DOM through collision and selection updates. Candidate changes (filter/Floor/data) follow existing collection replacement; collision itself never recreates markers.
Density supplies visibility, scale and priority. View mode writes scale/z-index, then reads the union of the actual 60px target and scaled/rotated artwork (including wide illustration images), then applies greedy collision. Stable Spot ID tie ordering, 10px gap, selected always accepted. O(n²) at current tens-of-Spots density.
One requestAnimationFrame batches move/zoom/render/resize/selection/filter/Floor/focus updates. Visibility:hidden keeps geometry measurable. inert/tabindex=-1/aria-hidden remove hidden candidates from keyboard and scripted focus; focus is moved to the Map region before blur. Detail close checks visibility/inert before restoring focus. Public size/selection scale transitions are immediate so measured geometry is settled; other decoration transitions retain the reduced-motion override. No canonical coordinates/categories/importance/snapshots changed.

PR27 P2 amendment: focus is temporarily non-suppressible alongside selected. Exact-coordinate alternate Spots are reachable from the detail navigation; no coordinates or candidate importance are altered.

## 68-09 final amendment

Equal priority now ranks viewport-center distance before stable Spot ID, with8px prior-winner retention. Connected measured collision groups live in Map presentation state. Group tap performs bounded center zoom; exact/maxZoom inseparable groups use radial/scrollable transient Map PINs. The Detail recovery implementation documented in historical QA is removed. Group construction plus decluttering remain O(n²), with scale writes before geometry and visibility writes after. See08-MAP-ONLY-RECOVERY-QA.md.
