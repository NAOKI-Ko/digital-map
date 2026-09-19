# WU-47 MapViewer Camera / Geolocation QA Evidence

Date: 2026-09-19 (Asia/Tokyo)

## Verdict and revisions

- Verdict: `PASS-READY`
- Authoritative baseline: `review/source-sync-20260919-203237` at `92252da255f36a07f4f28f27e94e02b1e8cf174f`
- Implementation and Windows QA release: `16b56cab540b9457c2446969448d33971e1fd2f5`
- Work branch: `refactor/wu47-mapviewer-camera-geolocation-20260919`
- Baseline preflight: clean, local/remote identical, ahead/behind `0/0`
- The documentation commit containing this evidence is reporting-only; `16b56ca` is the tested and deployed implementation SHA.

## Responsibility map

Before WU-47, `useMapViewer.ts` owned map creation, floor rendering, camera calculations and mutations, resize policy, mobile cover measurement, geolocation request/toast/marker lifecycle, controls, spot markers, decorations, editor placement, floor switching, and watchers.

After WU-47:

| Unit | Responsibility |
| --- | --- |
| `useMapViewer.ts` | Orchestration, MapLibre creation, floor raster, controls shell, spot markers, decorations, editor placement, floor switching, lifecycle/watchers |
| `useMapCamera.ts` | Map options/style, camera state/restore, floor fit and public cover, zoom constraints, passive resize policy, mobile cover measurement/cache, one-shot explicit-location camera policy |
| `useMapGeolocation.ts` | GeolocateControl lifecycle, request IDs, one-notice-per-request state, area decision, current-location marker, five-second toast, cleanup, availability |

`useMapViewer.ts` changed from 879 to 509 lines. Marker, decoration, and editor-placement responsibilities remain local by design.

## Camera API and policy

Public helpers:

- `createMapViewerOptions` / `createMapViewerStyle`
- `createFloorZoomConstraints`
- `createPublicFloorZoomConstraints`
- `getMapViewerCameraState` / `restoreMapViewerCamera`
- `applyPassiveCameraResize`
- `createOneShotLocationCameraPolicy`
- `useMapCamera`

The composable exposes `fitFloorBounds`, `getState`, `resetFloorCamera`, `resize`, and `restore`.

Allowed automatic camera causes are auditable and limited to:

1. initial map/floor load;
2. explicit floor switch;
3. one-shot result of an explicit location request, where the accepted UX restores the pre-request camera once;
4. explicit focus/admin command, including compass reset and `focusSpot`;
5. a genuine viewport constraint change where the existing zoom is outside the recalculated hard bounds.

Camera mutation inventory in the MapViewer path:

- `restoreMapViewerCamera` calls `jumpTo` for explicit state restoration and hard-bound zoom-only clamp.
- `jumpToCamera` supports initial mobile-cover calculation/application.
- `fitFloorBounds` calls `easeTo` for initial desktop load and explicit floor switching.
- `MapNavigationControl` compass action calls `easeTo` only on an explicit user command.
- `focusSpot` calls `easeTo` only on an explicit focus command.

Geolocation updates, toast changes, spot detail, Info, category filters, modal focus, idle, same-layout viewport churn, and marker redraw do not directly mutate the camera.

## Geolocation API and contract

Public helpers:

- `beginGeolocationRequest`
- `consumeOutsideGeolocation`
- `shouldEnableGeolocate`
- `useMapGeolocation`

The composable exposes read-only `geolocationAvailable` and `geolocationAreaMessage`, plus `syncControl` and `removeControl`. It reports explicit requests and outside results through callbacks; it does not import or call camera mutation functions.

For each explicit request, the orchestrator records one pre-request camera. The first outside result may consume and restore that camera once. Continued `trackUserLocation` events for the same request cannot restore again or produce another toast. A later explicit request increments the request ID and may notify once again. The toast contract remains `5,000 ms`.

## Resize policy

- `Map.resize()` always runs.
- A stable layout key (including same-orientation mobile browser-chrome changes measured against the large viewport height) skips constraint recalculation and camera mutation.
- A genuine layout/orientation change recalculates hard bounds.
- A valid camera remains unchanged.
- An invalid zoom is clamped with the previous center preserved; no floor-center refit occurs.

## Regression coverage

New behavioral tests cover:

- one outside notice for a continuing GPS watcher request;
- a new notice after a new explicit request;
- one-shot pre-request camera restoration and no later watcher pull-back after user movement;
- same-layout passive resize with no camera call;
- genuine viewport change with a valid camera and no refit;
- hard-bound zoom-only clamp with center preservation.

Existing/strengthened coverage preserves public whole-fit minus one minimum zoom, public pan allowance, floor-switch behavior, initial mobile cover contract, and the admin zero zoom-out allowance.

## Automated validation

All commands passed at implementation SHA `16b56ca`:

- focused camera/geolocation/viewer tests: 3 files, 39 tests
- full test suite: 75 files, 507 tests
- `pnpm typecheck`
- `pnpm prisma:validate`
- `pnpm prisma:generate`
- `pnpm build`
- `git diff --check`
- `pnpm audit:image-spatial-migration`: passed against a disposable isolated PostgreSQL database, zero exceptions

The isolated database and local-only QA fixtures were removed after validation. No schema, API, RBAC, publication, or server behavior changed.

## Browser QA

The prescribed `agent-browser` executable was unavailable, so the documented browser-control fallback was used with the real local app.

Public viewport coverage:

| Viewport | Result |
| --- | --- |
| 390 x 844 | Initial cover, minimum zoom, outside-image pan, detail/Info/filter stability, and height-return stability passed |
| 430 x 932 | Initial cover and responsive presentation passed |
| Desktop browser | Actual controlled viewport was 1470 x 705; initial view, zoom/pan, modal/filter stability, floor switch, and idle map-region stability passed |

Additional observations:

- Mobile height changed `844 → 700 → 844`; the returned map image was pixel-identical.
- The 60-second idle check preserved the map region. A full-page comparison observed only the existing geolocate-control animation; a subsequent 30-second map-region comparison was exact.
- Spot detail open/close, Info open/close, and category round-trip preserved the camera.
- A local-only second-floor fixture verified that an explicit floor switch applies its initial camera once and remains stable afterward.
- Admin smoke passed PIN selection, move candidate/ghost alignment, zoom/pan, live design draft, cancel/discard, and floor change.
- Local console had no errors. Existing non-core warnings were a Reka `DialogContent`/`DialogTitle` accessibility warning and a MapLibre fit warning produced by the synthetic floor fixture.
- The browser supplied no usable live geolocation feed, so an actual outside-GPS browser event and five-second toast timing could not be exercised end-to-end. The exact request/watcher/camera regression and the 5,000 ms contract are covered by behavioral unit tests.
- Physical iPhone Safari: not run. Chrome responsive testing is not represented as physical Safari.

## Windows QA preflight and deployment

- Active pre-deploy SHA: `92252da255f36a07f4f28f27e94e02b1e8cf174f`
- Full tracked-tree parity: 504/504 files matched SHA-256; missing 0, mismatched 0
- Services before deployment: Digital Map, PostgreSQL, and Cloudflare Tunnel running; local HTTP passed
- Disk before deployment: approximately 5.86 GB free; approximately 4.3 GB free during build
- Exact implementation archive SHA-256: `ce67c5b1d281fe05a3dd6b9c2ee0cac745e545e5b41a9141e2401fcd666ac46b`
- Release directory: `C:\DigitalMap\releases\16b56cab540b9457c2446969448d33971e1fd2f5`
- Activated at: `2026-09-19T22:04:57.8793950+09:00`
- Transition: `92252da255f36a07f4f28f27e94e02b1e8cf174f → 16b56cab540b9457c2446969448d33971e1fd2f5`
- Windows gates passed: dependency install, Prisma generate/validate, migration status, spatial audit with zero exceptions, 75 files/507 tests, typecheck, and build
- No migration was applied; no database reset/reseed occurred
- Post-switch services: Digital Map, PostgreSQL, and Cloudflare Tunnel running; local ready/HTTP passed
- HTTP 200: local `/api/ready`, `/`, `/login`, `/admin`, `/sitemap.xml`, `/team-demo-arimatsu`; public `/api/ready` and `/team-demo-arimatsu`
- Public QA URL: `https://sur-context-basin-concert.trycloudflare.com`
- Public map smoke and authenticated admin editor smoke passed at the QA URL; both final browser console checks had zero errors/warnings
- Both the previous and new release directories remain present

## Backup

Verified backup:

- `C:\DigitalMap\backups\pre-wu47-92252da-20260919-215427`
- Database dump: 119,938 bytes
- Media archive: 19,946,363 bytes
- Checksum entries: 1,723
- Verification: passed

An earlier backup attempt at `C:\DigitalMap\backups\pre-wu47-mapviewer-refactor-92252da-20260919-20260919-215352` verified the database/media artifacts but hit Windows path-length limits during runtime copying. It was left intact for forensic transparency. All pre-existing backups and releases were preserved.

## Severity and limitations

- P0: 0
- P1: 0
- Core P2: 0
- Human UAT: not automatically marked PASS
- Remaining limitations: physical iPhone Safari and a real outside-area browser geolocation event were not available. These do not conceal a known core defect; the exact geolocation watcher regression is behaviorally tested.

No main merge and no Production deployment were performed.
