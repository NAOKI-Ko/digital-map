# IMAGE Spatial Model Contract

Date: 2026-09-13

## Canonical Spot placement

For Illustration/IMAGE Maps, a positioned Spot has normalized `x` and `y` with `0 <= x <= 1` and `0 <= y <= 1`. Top-left is `(0, 0)` and bottom-right is `(1, 1)`. An unpositioned Spot is exactly `x = null, y = null`. Partial or out-of-range state is invalid and must be rejected by API and, where practical, database constraint.

Spot-level real-world `lat/lng` is not active persistence and must not be dual-written or synchronized with `x/y`. MapLibre coordinates needed for rendering are computed transiently from `x/y` and the current Floor transform/fallback and are never written back to Spot.

## Floor georeference

Georeference belongs to the Floor and maps IMAGE coordinates to GEO coordinates. It remains optional and uses exactly two corresponding points A/B. Image-side reference coordinates are normalized (`refAImageX/Y`, `refBImageX/Y` conceptually); real-side reference values remain latitude/longitude. Four corners and transform parameters are computed, not persisted.

Adding, editing, resetting an edit draft, removing, or reviewing georeference never mutates Spot `x/y` or Decoration placement. `基準点をリセット` clears only current edit selections. `ジオリファレンスを解除` requires confirmation and removes only the saved mapping. Before saving with existing Spots, state: `イラスト上のPIN位置は変わりません。実世界との対応のみ更新されます。`

The setup flow is A on illustration, matching A on real map, B on illustration, matching B on real map, then overlay confirmation. Image zoom/pan supports precise placement and does not mutate selected image coordinates. Confirmation permits adjusting A/B and overlay opacity, but no free transform, four-corner dragging, independent rotation, scale, or translation controls. Real-world-dependent features are eligible only with valid A/B data.

## Rendering and interaction

Top-left, center, and bottom-right must round-trip between normalized IMAGE and render coordinates. Both fallback and georeferenced rendering and inverse transforms are supported. A map click outside the illustration does not create a placement candidate. During a new drag interaction, movement may remain natural but the candidate persisted on completion is constrained to the illustration boundary.

Position reconfiguration uses a candidate: `位置を設定` for unpositioned Spots and `位置を再設定` for positioned Spots. Entry, clicks, and drags do not mutate persisted `x/y`; Save persists the candidate and Cancel is a no-op. `PIN配置を解除` requires confirmation, preserves the Spot and all information/relationships, and sets `x/y` to `null/null`. Unpositioned Spots never appear publicly.

Address assistance is offered only with valid Floor georeference. It geocodes address to temporary GEO candidates, allows candidate selection, inversely transforms to candidate IMAGE `x/y`, allows visual confirmation/drag adjustment, and persists only `x/y` after explicit save. Address changes never move a PIN; moving a PIN never rewrites address.

## Illustration replacement

Replacing a Floor illustration preserves Floor identity, Spots, Spot `x/y`, categories, PIN settings, publication state, Decoration relative placement, and normalized georeference image points. It updates only the asset/reference and exact image dimensions. It does not reposition based on content or aspect ratio and never performs visual/AI matching. Existing GEO reference latitude/longitude is preserved, followed by a clear alignment-review warning when georeference exists.

## Legacy migration and preflight

The current rendered contact point is authoritative. A reusable read-only `audit:image-spatial-migration` command must report and exit non-zero for:

- Floors with non-positive dimensions, including Floor ID, Map ID, illustration reference, dimensions, and positioned Spot count.
- partial legacy `lat/lng`, including Spot ID, Floor ID, name, and values.
- complete legacy positions whose deterministic inverse of the current render transform produces raw `x/y` outside the illustration, including IDs, name, legacy coordinates, and raw `x/y`.

For migration calculations and the migration audit only, values within `1e-12` of `0` or `1` may snap to the boundary. Genuine out-of-bounds values must not be clamped. This epsilon is not used for normal interactive placement. Visual PIN contact-point drift must be at most one CSS pixel under an equivalent viewport/camera.

Invalid dimensions may be repaired only from exact metadata of the currently referenced, locally available managed image bytes, followed by another read-only audit. Missing/corrupt/inaccessible/external-only bytes remain exceptions. Partial coordinates and genuinely out-of-bounds Spots require explicit operator correction to a valid complete position or explicit unpositioning. Migration aborts until all exceptions are resolved.
