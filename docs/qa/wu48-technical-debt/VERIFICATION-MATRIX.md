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
| Dependency audit | PASS | `pnpm audit --prod`: zero advisories after path-scoped `@prisma/config>deepmerge-ts` 8.0.2 override |
| Dependency compatibility | PASS | Prisma remains 7.10.0; frozen install, validate/generate, 76 files/510 tests, typecheck, PostgreSQL 17 migrations/audit, build, and browser regression passed |
| CI definition | PASS | GitHub Actions run `35451638348`; Node 24, pnpm 11.9.0, PostgreSQL 17; frozen install, migrations/spatial audit, typecheck, 510 tests, and build passed with the override |
| Desktop Chromium public Map | PASS | real MapLibre rendering; PIN detail, close/focus return, Info exclusivity, categories; no error and repaired Reka warning absent |
| Admin Chromium | PASS | bulk publish/unpublish; PIN selection, move draft, Cancel; no error/warning |
| Dependency follow-up browser regression | PASS | isolated DB/release; public MapLibre, PIN detail/generated title, category filter; authenticated admin login, PIN selection and move/Cancel; console empty |
| 390×844 / 430×932 Chromium shell | PASS with limitation | responsive controls/safe-area layout captured; macOS headless WebGL was unavailable, so real Map rendering used controlled desktop and WU-47 width-specific evidence |
| Mock geolocation behavior | PASS | request IDs, one notice, five-second contract, new explicit request, and no watcher camera pullback covered by tests |
| Physical iPhone Safari | BLOCKED | TD-011 |
| Real browser GPS outside-area event | BLOCKED | TD-011 |
| Windows exact-SHA tree / backup / restore / deploy | PASS | SHA `5d372a5`; 519/519 archive files; production audit zero; verified backup; disposable restore app 200; local/public smoke 200 |
| Fresh clone | PASS | remote SHA `5d372a5`; frozen install, production audit zero, Prisma validate/generate, typecheck, 76/510 tests, and build passed |

## Browser warning review

- Reka `DialogContent`/`DialogTitle`: reproduced, root-caused, fixed, and browser-rechecked as TD-009.
- MapLibre fit warning: not reproduced with the seeded 1448×1086 floor; classified TD-013 NOT_A_DEBT for the production path.
- Nuxt development-only `<Suspense>` information and DevTools messages are not production build warnings.
- Windows build also emitted upstream Node trailing-slash export deprecations and Rollup's removal of two misplaced Zod pure-annotation comments; build output and runtime remained valid.
- GitHub Actions annotated future runner migration and Node-20-based action internals being forced to Node 24. The job itself used Node 24 and passed; changing action majors remains outside this unapproved dependency-major scope.

## Windows QA evidence

- Archive SHA-256: `169f725843bb9a5ffe6e9af8bd42e930f485283426f4cb311656deb216d75512`
- Release: `C:\DigitalMap\releases\5d372a5a4332238af0d7084edd305a557f08f522`
- Activated: `2026-09-20T00:39:45.6467086+09:00`
- Verified backup: `C:\DigitalMap\backups\pre-wu48-deps-81dbc0f-20260920-002840`; DB dump 120,003 bytes; media archive 19,946,363 bytes; 34 manifest files; 1,727 checksum entries.
- Disposable restore: separate `digital_map_wu48_deps_restore` database and empty temporary media directory; migration status, spatial audit, exact media verification, `/api/ready` 200 and `/admin/login` 200 passed; disposable targets were removed afterward.
- Active application, PostgreSQL and Cloudflare Tunnel were running. Local `/api/ready`, `/`, `/login`, `/admin`, `/sitemap.xml`, `/team-demo-arimatsu`, and public `/api/ready`, `/team-demo-arimatsu` returned 200.
- Post-update browser console for public detail and authenticated admin editor was empty. PIN detail title resolved to Reka's generated id, close returned focus, category filtering worked, and admin move draft/Cancel passed.
- Previous release `81dbc0f0ff0f19351d5c3987621f3886bd8f54c9` and all backups remain present. No Production deployment occurred.

## Human device steps

1. Open the QA public map in physical iPhone Safari at 390-class and 430-class widths.
2. Collapse/expand Safari toolbars; confirm the Map does not jump or recenter.
3. Open a PIN, scroll to the end, expand/collapse the sheet, close it, and confirm focus/camera return.
4. Pan outside the floor, wait 60 seconds, open/close Info and categories, and confirm no camera takeover.
5. Grant location, make an explicit request while physically outside the mapped area, confirm one notice for five seconds, keep GPS tracking active, move the map, and confirm later watcher updates do not take the camera.
6. Start another explicit location request and confirm exactly one new notice.
