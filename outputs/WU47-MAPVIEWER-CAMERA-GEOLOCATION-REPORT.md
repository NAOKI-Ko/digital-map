# WU-47 MapViewer Camera / Geolocation Final Report

Date: 2026-09-19 (Asia/Tokyo)

## 1. Verdict

`PASS-READY`

Human UAT remains separate and is not automatically marked PASS.

## 2. Baseline to final implementation SHA

- Baseline: `92252da255f36a07f4f28f27e94e02b1e8cf174f`
- Final tested/deployed implementation: `16b56cab540b9457c2446969448d33971e1fd2f5`
- Transition: `92252da255f36a07f4f28f27e94e02b1e8cf174f → 16b56cab540b9457c2446969448d33971e1fd2f5`

The later commit containing this report is documentation-only. The implementation SHA above is the exact revision used for all automated validation and the Windows QA release.

## 3. Branch

`refactor/wu47-mapviewer-camera-geolocation-20260919`

The branch was created from the exact authoritative source SHA and pushed to GitHub. The authoritative review branch was not rewritten and main was not merged.

## 4. Files added and changed

Added:

- `app/composables/useMapCamera.ts`
- `app/composables/useMapGeolocation.ts`
- `tests/map-camera.test.ts`
- `tests/map-geolocation.test.ts`
- `docs/qa/wu47-mapviewer-camera-geolocation-20260919/README.md`
- `outputs/WU47-MAPVIEWER-CAMERA-GEOLOCATION-REPORT.md`

Changed:

- `app/composables/useMapViewer.ts`
- `app/components/map/MapViewer.vue`
- `tests/map-viewer.test.ts`
- `tests/admin-shell-accessibility.test.ts`

The implementation commit changed 8 product/test files with 729 insertions and 433 deletions. `useMapViewer.ts` was reduced from 879 to 509 lines without splitting markers, decorations, or editor placement.

## 5. Responsibility before and after

Before: `useMapViewer.ts` combined map creation, floor raster, camera policy, resize/mobile cover, geolocation request/toast/marker lifecycle, controls, markers, decorations, editor placement, floor switching, and watchers.

After:

- `useMapCamera.ts` owns camera calculations, constraints, state restoration, floor fit/cover, resize policy, cover measurement/cache, and the one-shot location camera policy.
- `useMapGeolocation.ts` owns GeolocateControl, explicit request IDs, one outside notice per request, floor-area decisions, current-location marker, five-second toast, availability, and cleanup.
- `useMapViewer.ts` orchestrates those units while retaining floor rendering, markers, decorations, editor placement, and lifecycle coordination.

## 6. Root risk addressed

Continuing `trackUserLocation` events could repeatedly execute camera restoration from inside geolocation handling after a single explicit request, potentially pulling the camera away from the user's later pan/zoom. Resize also coupled MapLibre resizing, constraint recalculation, and camera restoration, allowing passive viewport churn to create camera movement.

Both couplings are now explicit, bounded, and behaviorally tested.

## 7. Geolocation/camera contract

- Geolocation does not calculate floor camera, set zoom constraints, or call `jumpTo`, `easeTo`, or `fitBounds`.
- Each explicit location request receives a request ID and may create only one outside notice.
- The orchestration/camera boundary records the pre-request camera and consumes it at most once on the first outside result.
- Continued watcher updates for the same request cannot restore the camera or show another toast.
- A new explicit request may notify and apply the accepted one-shot policy once again.
- Outside toast duration remains exactly 5,000 ms.

## 8. Resize policy

- MapLibre `resize()` always runs.
- Same-layout/same-orientation browser-chrome churn skips constraint recalculation and all camera mutation.
- A genuine layout/orientation change recalculates constraints.
- If the current zoom remains valid, center/zoom are untouched.
- If the current zoom becomes invalid, only zoom is clamped while preserving center; there is no floor refit.

## 9. Tests and build validation

Passed at `16b56ca`:

- focused camera/geolocation/viewer tests: 3 files, 39 tests
- full suite: 75 files, 507 tests
- typecheck
- Prisma validate
- Prisma generate
- production build
- `git diff --check`
- image spatial migration audit against a disposable PostgreSQL database: zero exceptions

No database schema, API contract, RBAC, auth, CSRF, snapshot schema, publication, tenant, or server behavior changed.

## 10. Browser QA

Public checks passed at 390 x 844, 430 x 932, and an actual desktop viewport of 1470 x 705:

- initial mobile cover
- zoom-out to accepted minimum
- pan beyond the illustration
- modal, detail sheet, category, and Info round trips without camera movement
- floor switch applies its initial camera once
- mobile height `844 → 700 → 844` returns to a pixel-identical map image
- 60-second idle map region remains stable

Admin checks passed PIN selection, move candidate/ghost alignment, live design draft, zoom/pan, cancel/discard, and floor change. The Windows public and authenticated admin editor final browser logs contained no errors or warnings.

The browser environment did not provide a usable live geolocation feed. A real outside-area event and visual five-second toast timing were therefore not run end-to-end; the exact one-request/watcher/camera scenario and 5,000 ms duration are covered in behavioral tests. Physical iPhone Safari was not run.

## 11. Windows parity and deployment

- Pre-deploy active SHA: `92252da255f36a07f4f28f27e94e02b1e8cf174f`
- Tracked-tree comparison: 504/504 SHA-256 matches, missing 0, mismatched 0
- Exact deployed SHA: `16b56cab540b9457c2446969448d33971e1fd2f5`
- Archive SHA-256: `ce67c5b1d281fe05a3dd6b9c2ee0cac745e545e5b41a9141e2401fcd666ac46b`
- Release: `C:\DigitalMap\releases\16b56cab540b9457c2446969448d33971e1fd2f5`
- Activated: `2026-09-19T22:04:57.8793950+09:00`
- Windows install, Prisma validation/generation, migration status, spatial audit, 507 tests, typecheck, and build all passed
- No migration was applied; no database reset/reseed occurred
- Digital Map, PostgreSQL, and Cloudflare Tunnel are running
- Local and public readiness/HTTP checks passed
- QA URL: `https://sur-context-basin-concert.trycloudflare.com`

This was a Windows QA Quick Tunnel deployment, not a Production deployment.

## 12. Backup and release preservation

Verified backup:

- `C:\DigitalMap\backups\pre-wu47-92252da-20260919-215427`
- DB dump: 119,938 bytes
- Media archive: 19,946,363 bytes
- Checksum entries: 1,723
- Verification: passed

An earlier long-path backup attempt remains preserved at `C:\DigitalMap\backups\pre-wu47-mapviewer-refactor-92252da-20260919-20260919-215352`; its DB/media artifacts verified, while runtime copying encountered Windows path-length limits. No previous backup or release was deleted.

## 13. Remaining limitations

- Physical iPhone Safari: not run.
- Real outside-area browser geolocation event: not available in the QA browser; covered by behavioral regression tests instead.
- Human UAT: pending as a separate activity.

## 14. Severity

- P0: 0
- P1: 0
- Core P2: 0

No main merge, no Production deployment, and no deletion of previous backups/releases occurred.
