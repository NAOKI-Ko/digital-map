# WU-52 Final Report

Date: 2026-09-20 (Asia/Tokyo)

## 1. Final verdict

`BLOCKED: GITHUB PUSH / CI AUTHORIZATION REQUIRED`

The application work and all available local authoritative gates pass. The candidate has not been pushed to `NAOKI-Ko/digital-map`, so GitHub Actions Verify has not run. `PASS-READY` is intentionally not claimed until that required non-waived gate succeeds.

## 2. Base SHA / branch

- Authoritative base: `73466a03cdf8ae130b5ed9613389f775c82589de`
- Verified WU-51 GitHub Actions run: `35493833201` (`success`)
- Merge base: `73466a03cdf8ae130b5ed9613389f775c82589de`
- Branch: `refactor/wu52-direct-manipulation-toast-csv-revision-20260920`
- The branch was created from the exact authoritative base with no carried application changes.

## 3. Final implementation SHA

`719a3296512be1892cf84dce2ad5d0f4d9b93856`

## 4. Evidence SHA

`b3846ea42cb36d6cb1d73ec4c4192a26be55a1b8`

The final report and evidence index were generated after this evidence commit and do not change application behavior.

## 5. Files changed

- 37 committed files relative to the authoritative base
- 1,175 insertions, 218 deletions
- Application areas: global Toast, Admin selects, decoration editor, CSV v3, revision review UI and APIs
- Contracts: four files under `docs/product-contracts/`
- QA: five evidence documents under `docs/qa/wu52-direct-manipulation-toast-csv-revision/`
- Automated coverage: `tests/wu52-direct-manipulation-toast-csv-revision.test.ts`
- No package or lockfile change
- No Prisma schema or migration change

## 6. Decoration direct-manipulation result

PASS locally and in browser QA.

- A selected decoration uses an explicit local draft and renders move, resize, and rotate changes immediately.
- Pointer movement is requestAnimationFrame-coalesced and does not PATCH.
- Pointer commit performs one PATCH; pointer cancel restores the immutable start snapshot without PATCH.
- Save failure restores the exact previous values.
- Resize preserves source aspect ratio, works from center-distance geometry, clamps width, and is independent of rotation.
- Rotation uses center-angle delta with stable normalization.
- Body, resize handle, and rotate handle are keyboard-operable with Arrow and Shift+Arrow steps.
- Handles are touch-sized; selected state and focus are visible.
- Inspector commands are only `後ろへ`, `前へ`, `複製`, `削除`.
- Duplicate selects the new item; delete uses `装飾を削除` confirmation.
- Browser QA exercised select, drag, keyboard resize/rotate, duplicate, and delete-dialog cancellation. A destructive deletion was not submitted against the disposable fixture.

## 7. Decoration performance / rerender result

The local object visibly followed the interaction without waiting for the server, and a single completion Toast appeared after drag commit. Source and automated contract checks verify no request in pointer-move handling and one commit path on pointer-up. No repeated full-page refresh exists in the gesture path.

The in-app browser surface did not expose a reliable Long Task observer, so numeric `long tasks >50ms` and an FPS value were not recorded. No visible freeze or obvious jank was observed. No unsupported `60fps` claim is made. See `PERFORMANCE.md` for the evidence boundary.

## 8. VM166 diagnostic conclusion

`NOT REPRODUCED`

Browser console QA reported zero application errors. Neither `VM166`, `reportAllChanges`, nor the `startTime` failure appeared. Repository and built-code searches did not identify application references that would support attributing the supplied anonymous VM stack to this application.

## 9. Toast migration result

PASS.

- One global `UiToastHost` is mounted at app root.
- The app-owned composable supports success/info/error roles, accessible dismissal, 4-second success/info and 6-second error defaults, hover/focus pause, a three-item cap, and keyed coalescing.
- Transient Admin successes were migrated across Map/Floor/Category-adjacent save feedback, Spot operations, PIN, decoration, CSV, revision, publishing, georeference, editor, assignee, and photo flows where present.
- Busy state remains on controls; validation, page-blocking errors, CSV row errors/conflicts, and stale-revision explanations remain persistent inline feedback.

## 10. Select migration result

PASS.

- Product-controlled ordinary Admin single-selects use the canonical `UiSelect`.
- Static search found no native `<select>` in `app/pages/admin` or `app/components/admin`.
- Desktop/mobile rendering and Home/Enter keyboard selection were checked in browser QA.
- The public locale native selector remains a documented domain-specific exception; file pickers are not selects.

## 11. CSV v3 format and API result

PASS locally.

- The normal screen has only `CSVを書き出す` and `CSVを取り込む`; no Floor selector or template link is shown.
- Export is Map-wide and ordered by Floor order, Spot name, then Spot ID.
- User columns use Japanese human labels first; `__csvVersion`, `__schemaVersion`, `__spotId`, `__rowVersion`, and `__floorId` are last.
- Duplicate custom labels are deterministically suffixed.
- Schema identity covers locales, field definitions/labels/order, and Floor identity/name/order.
- Preview/apply request bodies are `{ csv }`; v3 Floor context is carried by each row.
- New rows require an exact, unambiguous current Floor name. Existing Spot Floor moves are blocked with the specified guidance.
- Formula-injection protection, row/schema conflicts, tenant/Map isolation, validations, non-deletion semantics, and serializable all-or-nothing apply remain intact.

## 12. CSV compatibility behavior

PASS locally.

- v3 is the normal full-support format.
- v2 remains accepted only where legacy context proves a single safe Floor association.
- Unsafe Map-wide v1/v2 files are rejected with guidance to export a current CSV.
- No hidden Floor selector or guessed Floor context was introduced.

## 13. Revision review UI result

PASS locally and in browser QA.

- Raw payload JSON is absent from the normal UI.
- Cards show Spot, author, submitted time, human field labels, and only changed current/requested values.
- Custom fields use current labels; supported values render human-readably; photos render managed thumbnails only when changed.
- The list API adds a backward-compatible `review` representation while retaining legacy scalar/payload/photo fields.
- A stale disposable fixture showed the required warning and a disabled Approve action while Reject remained available.
- Reject uses a Dialog, preserves the reason on failure, and approve/reject success uses Toast.
- Server approval and 409 version-conflict semantics are unchanged.

## 14. Route / API / schema changes

- Existing routes were retained.
- CSV export no longer requires `floorId`; preview/apply accept `{ csv }`.
- Revision GET adds structured `review` data additively.
- No database schema change, migration, dependency, authentication, RBAC, ownership, publication, analytics, camera, or media-deletion contract change.

## 15. Automated tests

- Existing worktree, isolated PostgreSQL 17: 84 files, 559/559 tests PASS.
- Existing worktree without DB-only cases: 543 PASS, 16 skipped.
- Clean clone from the candidate: frozen lockfile install PASS; 543 PASS, 16 skipped; typecheck PASS; production build PASS.
- Prisma validate PASS; Prisma generate PASS.
- All 30 migrations applied to isolated PostgreSQL; no new migration.
- Tenant Data Foundation audit PASS with zero anomalies.
- IMAGE spatial audit PASS with zero exceptions.
- Production dependency audit at high threshold: zero known vulnerabilities.
- `git diff --check` PASS.
- Build has the pre-existing large-chunk advisory only.
- GitHub Actions Verify: NOT EXECUTED because the branch has not been authorized for push.

## 16. Browser / visual / accessibility

PASS for exercised local scenarios at 1280x800, 390x844, and 430x932.

- Admin routes rendered without blank pages, blocking overlays, or console errors.
- Decoration selection/handles, local drag, keyboard handles, duplicate Toast, and confirmation dialog were readable and operable.
- CSV two-action layout and revision diff/stale UI were readable at mobile widths.
- Representative `UiSelect` keyboard behavior passed.
- Live regions, focusable transform controls, ARIA operation labels, accessible Toast dismissal, and disabled stale approval are implemented.

## 17. Open defects

- P0: 0
- P1: 0
- Core P2: 0 found in completed local gates
- External gate: GitHub push/CI authorization is outstanding.
- Evidence limitation: numeric browser Long Task/FPS measurements were unavailable; observable responsiveness and request-boundary evidence passed.

## 18. Windows QA status

`NOT EXECUTED / WAIVED`

This is recorded as the product-owner waiver in the WU-52 input and is not described as PASS.

## 19. main / Production status

- `main`: unchanged
- Production: unchanged; no deployment performed
- Candidate exists only on the local WU-52 branch pending explicit authorization to push to GitHub and run CI.
