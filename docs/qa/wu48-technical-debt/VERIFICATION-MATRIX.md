# WU-48 R2 Verification Matrix

Implementation target: `7c57e573e628e94d3858ab923a8d812a1bbbe2ff`. A later evidence commit changes documentation only.

| Gate | Result | Evidence / limitation |
| --- | --- | --- |
| Frozen install | PASS | final local fresh clone and Windows QA, pnpm 11.9.0 |
| Production dependency audit | PASS | `pnpm audit --prod --audit-level high`: no known vulnerabilities; no ignore configuration |
| Prisma validate / generate | PASS | stable Prisma 7.10.0; schema valid and client generated |
| Isolated migrations | PASS | PostgreSQL 17; all 28 migrations applied/current locally, in final fresh clone, CI, and Windows QA |
| IMAGE spatial audit | PASS | zero invalid IMAGE floors/references, partial/outside spots, or published-unpositioned spots |
| Full tests | PASS | 78 files / 522 tests locally, final fresh clone, CI, and Windows |
| Publication PostgreSQL races | PASS | four integration cases: publish/publish, both publish/unpublish orders, storage failure, and DB-failure compensation |
| Typecheck | PASS | Nuxt typecheck in all required environments |
| Production build | PASS with classified warnings | known large map chunk/plugin timing, Node DEP0155, and Rollup removed Zod-comment warnings only |
| Diff / tree checks | PASS | `git diff --check`; final fresh clone clean; Windows archive tree 522/522 tracked files |
| GitHub Actions | PASS | run [35459480854](https://github.com/NAOKI-Ko/digital-map/actions/runs/35459480854), head `7c57e57`; audit, Prisma, DB, spatial, typecheck, tests, build |
| Local browser regression | PASS | public/admin desktop and 390×844 / 430×932; detail/focus, Info, categories, selection and move/Cancel |
| Final Windows browser regression | PASS | public MapLibre with 10 PINs; detail/focus return; Info; admin selection/move/Cancel; warning/error log empty |
| Mock geolocation lifecycle | PASS | one notice per explicit request, five-second timer, new-request reset, and watcher camera ownership |
| Fresh clone | PASS | exact implementation SHA: frozen install, audit, Prisma, isolated DB/spatial, typecheck, 522 tests, build, clean status |
| Windows QA activation | PASS | previous `5d372a5` → implementation `7c57e57`; services running and local/public smoke 200 |
| Verified backup / restore | PASS | SHA-256 recorded below; disposable DB/media restore had 28 migrations, zero spatial exceptions, exact 34 files; targets cleaned |
| Windows junction rejection | PASS | directory junction fixture rejected as unsupported link; fixture cleaned |
| Physical iPhone Safari | BLOCKED | TD-011 Human UAT |
| Real outside-area GPS event | BLOCKED | TD-011 Human UAT |
| Repository governance settings | BLOCKED_APPROVAL | TD-014; workflow source is fixed, but main/default promotion and protection require explicit approval |

## Windows QA evidence

- Release: `C:\DigitalMap\releases\7c57e573e628e94d3858ab923a8d812a1bbbe2ff`
- Activated: `2026-09-20T03:10:33.7435365+09:00`
- Release archive: `C:\DigitalMap\runtime\digital-map-7c57e573e628e94d3858ab923a8d812a1bbbe2ff.zip`
- Release archive SHA-256: `d60052ce1a37b22f5b995ffadf3d81eb94943c589723eda3d0e87e5fe1fa760a`
- Verified backup root: `C:\DigitalMap\backups\pre-wu48-r2-5d372a5-20260920-0245`
- DB dump: `db\digital-map-20260919T174708Z.dump`, 120,036 bytes, SHA-256 `eae5a2911842e45b68ed3da2e1ef909a0a8c42e66d2cc6a6532faee50c6d6b2a`
- Media archive: `media\20260919T174709Z\media.tar.gz`, 19,946,363 bytes, SHA-256 `35912f2eda997bb9deecc2cfef6e469058ff6da442277473c52f2b97c9550349`
- Media manifest: 6,645 bytes; restored exact 34 files.
- Active application, PostgreSQL, and Cloudflare Tunnel were running. Local and public `/api/health`, `/api/ready`, `/admin/login`, and `/team-demo-arimatsu` returned 200.
- Old releases, including the unactivated failed candidate, and all backups remain preserved. No Production deployment occurred.

## Human device steps

1. Open the QA public map in physical iPhone Safari at representative 390-class and 430-class widths.
2. Collapse/expand Safari toolbars; confirm the Map does not jump or recenter.
3. Open a PIN, scroll to the end, expand/collapse the sheet, close it, and confirm focus/camera return.
4. Pan outside the floor, wait 60 seconds, open/close Info and categories, and confirm no camera takeover.
5. Grant location, explicitly request location while physically outside the mapped area, confirm one five-second notice, keep tracking active, move the map, and confirm watcher updates do not take the camera.
6. Start another explicit request and confirm exactly one new notice.
