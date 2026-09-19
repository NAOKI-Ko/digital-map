# WU-48 Audit Coverage

The audit traced entry points through UI/composables, APIs, persistence, public snapshots, tests, scripts, and operations. Source inventory used `git ls-tree`/`git ls-files`; route and state flows were reviewed in addition to searches and static checks.

| Area | Files / path | Method and contract | Result / debt | Uninvestigated | Environment / evidence |
| --- | --- | --- | --- | --- | --- |
| Public Map | `app/pages/[mapSlug]`, map components/composables | State exclusivity, focus return, timers/listeners, category and camera stability | cleanup fixed TD-003; dialog a11y fixed TD-009 | none in source audit | isolated fixture browser and unit tests |
| Camera / geolocation | `useMapViewer`, `useMapCamera`, `useMapGeolocation` | WU-47 one-shot request and camera ownership | implementation retained; TD-011 verification blocked | physical Safari and real GPS only | behavioral tests; Chromium browser |
| Marker / decoration / placement | viewer, admin editor, decoration editor | IMAGE coordinates, draft/cancel, listener teardown | TD-003/004 fixed | none | browser smoke and focused tests |
| Admin UI | map editor, spots, spot editor, fields/floors/images | stale response, double submit, failure and cancel | TD-001/002/008 fixed | none | source/data flow review; browser smoke |
| Types / validation | `shared`, UI/API schemas | no `any` escape in revised Spot editor; layered validation retained | TD-008 fixed | none | typecheck and tests |
| Localization | locale constants, translations, snapshot mapping | WU-44 scope and fallback reviewed | TD-012 NOT_A_DEBT | none | contract/docs/source comparison |
| API / DB / auth | 105 server API handlers, auth/RBAC helpers, 28 migrations | tenant/map ownership, roles, validation, transactions | no new defect confirmed | none | tests plus isolated PostgreSQL migration/audit |
| Public / media | public release/storage, upload/media routes | immutable assets, path safety, compensation and rollback | TD-005 fixed | none | local object-storage race test |
| Import/export/PDF | CSV, media, PDF routes and tests | validation, authorization, partial application | no new defect confirmed | none | source and existing behavior tests |
| Tests | 76 files after changes | behavior vs source checks, failures, races, cleanup, skip/only | new behavior/race coverage added | none | 510 tests, no skip/only |
| Performance | build output, viewer update boundaries, existing representative fixture | no invented scale target; check measured build and repeated UI paths | no measured regression; large map-library chunk recorded | none | production build and browser observation |
| Dependency / CI / operations | lockfile, workflow, scripts, backup docs | reproducibility, advisory scope, exact verification | TD-006/007 fixed; TD-010 blocked | none | pnpm audit, CI definition, drills |
| Documentation | README, operations, WU42-WU47 QA docs | current source of truth and contradictions | backup/restore corrected | none | document/source comparison |

## Inventory notes

- Hand-written source and configuration were reviewed by responsibility and end-to-end paths.
- Generated Prisma client, PNG images, and XLSX fixtures were classified and checked for role/usage; they were not claimed as line-level source review.
- Baseline area sizes for hand-written text were approximately: app 9,331 lines, server 5,156, shared 1,313, lib 660, tests 5,663, scripts 715, Prisma schema/migrations 1,352, docs 3,339.
- No audit area is omitted. Environment-only validation limitations are recorded as TD-011 rather than silently counted as pass.
