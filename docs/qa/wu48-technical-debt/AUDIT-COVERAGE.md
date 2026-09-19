# WU-48 R2 Audit Coverage

The second audit traced entry points through UI/composables, APIs, persistence, immutable public snapshots, tests, scripts, CI, source governance, and Windows operations. The R2 baseline is `e3d58c8835290cac2dbf3ac9a4e777c5df0b6255`.

| Area | Paths / method | R2 result | Residual limitation |
| --- | --- | --- | --- |
| Public Map and overlays | `app/pages/[mapSlug]`, Map components/composables; state transitions, focus, timers, categories, camera | TD-019 fixed; Windows and local browser regression passed | physical Safari is TD-011 |
| Camera / geolocation | `useMapViewer`, `useMapCamera`, `useMapGeolocation`; one-shot notice and watcher ownership | TD-018 automated lifecycle coverage passed | real outside-area GPS is TD-011 |
| Admin map editor | selection, position/design/unplace save completion, cancellation, stale responses | TD-021 generation/context guard fixed and interaction-tested | none in source scope |
| Publication concurrency | `public-storage.ts`, `public-release.ts`; deterministic unit interleavings and real PostgreSQL races | TD-005A/B fixed; four PostgreSQL concurrency/compensation cases passed on Windows | local storage remains single-process by contract |
| Public snapshot security | typed public schema, nested keys, upload parsing, realpath containment, deduplication | TD-016/017 fixed; traversal/backslash/encoded escape/outside-root cases reject | none |
| Backup / restore | DB identity normalization, disposable destination, filesystem traversal, exact manifest | TD-006A/B fixed; local and Windows restore drills passed; Windows junction rejected | tests never target QA/live DB |
| API / DB / auth | server routes/helpers, Prisma schema, 28 migrations, RBAC and validation | no new R2 debt; isolated migration and IMAGE spatial audits passed | none |
| Dependency security | lockfile ancestry, stable upstream path, scoped override, production audit | TD-010 remains verified; CI gate TD-015 fixed | override removal depends on approved stable Prisma line |
| CI / governance | `.github/workflows/verify.yml`, hosted run, repository settings boundary | TD-015 fixed; TD-014 source fixed | TD-014 repository settings require approval |
| Tests | 78 files / 522 tests; race, failure, timer, overlay and delayed-completion behavior | TD-018 fixed; no weakening or advisory ignore | physical-device coverage is not claimed |
| Browser | desktop plus 390×844 and 430×932; public/admin flows and console | local and final Windows QA passed, zero browser warnings/errors in final flow | responsive Chromium is not iPhone Safari |
| Performance / build | production build, viewer interactions, warning classification | passed; known upstream/chunk warnings recorded | no invented scale target |
| Documentation | README, WU-48 evidence, restore/publication source of truth | TD-020 fixed | governance decision intentionally deferred |

## Inventory notes

- Hand-written source/configuration was reviewed by responsibility and end-to-end data flow; generated clients and binary fixtures were classified by role rather than claimed as line-level review.
- No audit area was omitted. Environment- or authority-only items are explicit blockers, not silent passes.
- No Prisma major/RC, unrelated dependency refresh, schema migration, UI redesign, main merge, or Production deployment entered the R2 scope.
