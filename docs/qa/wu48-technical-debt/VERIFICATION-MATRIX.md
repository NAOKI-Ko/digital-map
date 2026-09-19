# WU-48 Verification Matrix

Verification target will be the final documentation SHA. Results below distinguish WU-48 runs from WU-47 historical evidence.

| Gate | Result | Evidence / limitation |
| --- | --- | --- |
| Prisma validate / generate | PASS | Prisma 7.10.0; schema valid; client generated |
| Full tests | PASS | 76 files, 510 tests |
| Typecheck | PASS | Nuxt typecheck |
| Production build | PASS with recorded warnings | 34.7 MB server output; one >500 kB map-library chunk and plugin timing warning |
| Diff check | PASS | `git diff --check` |
| Isolated migrations | PASS | PostgreSQL 17; all 28 migrations applied |
| IMAGE spatial audit | PASS | zero invalid floors/references, partial/outside spots, or published-unpositioned spots |
| Publication race | PASS | stale ETag compensation cannot replace newer pointer |
| Backup validation logic | PASS | canonical DB identity and missing/mismatch/unexpected media tests |
| Dependency audit | BLOCKED | one high production advisory, TD-010; patch requires major update approval |
| CI definition | PASS locally / hosted pending | workflow uses Node 24, pnpm 11.9.0, PostgreSQL 17 and the same command chain |
| Desktop Chromium public Map | PASS | real MapLibre rendering; PIN detail, close/focus return, Info exclusivity, categories; no error and repaired Reka warning absent |
| Admin Chromium | PASS | bulk publish/unpublish; PIN selection, move draft, Cancel; no error/warning |
| 390×844 / 430×932 Chromium shell | PASS with limitation | responsive controls/safe-area layout captured; macOS headless WebGL was unavailable, so real Map rendering used controlled desktop and WU-47 width-specific evidence |
| Mock geolocation behavior | PASS | request IDs, one notice, five-second contract, new explicit request, and no watcher camera pullback covered by tests |
| Physical iPhone Safari | BLOCKED | TD-011 |
| Real browser GPS outside-area event | BLOCKED | TD-011 |
| Windows exact-SHA tree / backup / restore / deploy | PENDING | completed after final implementation and evidence commits |
| Fresh clone | PENDING | completed against final immutable SHA |

## Browser warning review

- Reka `DialogContent`/`DialogTitle`: reproduced, root-caused, fixed, and browser-rechecked as TD-009.
- MapLibre fit warning: not reproduced with the seeded 1448×1086 floor; classified TD-013 NOT_A_DEBT for the production path.
- Nuxt development-only `<Suspense>` information and DevTools messages are not production build warnings.

## Human device steps

1. Open the QA public map in physical iPhone Safari at 390-class and 430-class widths.
2. Collapse/expand Safari toolbars; confirm the Map does not jump or recenter.
3. Open a PIN, scroll to the end, expand/collapse the sheet, close it, and confirm focus/camera return.
4. Pan outside the floor, wait 60 seconds, open/close Info and categories, and confirm no camera takeover.
5. Grant location, make an explicit request while physically outside the mapped area, confirm one notice for five seconds, keep GPS tracking active, move the map, and confirm later watcher updates do not take the camera.
6. Start another explicit location request and confirm exactly one new notice.
