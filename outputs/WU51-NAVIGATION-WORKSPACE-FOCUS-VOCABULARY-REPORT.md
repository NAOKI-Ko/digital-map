# WU-51 Navigation / Workspace / Focus / Vocabulary report

## 1. Final verdict

**PASS-READY — Windows QA gate explicitly waived by the product owner on 2026-09-20.**

All implementation-controlled local, isolated-DB, clean-clone, browser, accessibility, and GitHub Actions gates passed. The configured `chiffonchan` Windows QA endpoint was unreachable because the product owner was away from the Windows machine's local network. Windows QA was **not executed**. The product owner explicitly accepted that residual risk and approved WU-51 based on the completed local/isolated/browser/CI evidence.

This waiver does not represent a Windows QA PASS and must not be described as one.

## 2. Base SHA / branch

- Authoritative base: `a8ed7dcb8b98bb36b588f3a1b6973042fa583a07`
- Branch: `refactor/wu51-navigation-workspace-focus-vocabulary-20260920`
- Preflight HEAD and merge-base both matched the authoritative base.

## 3. Final implementation SHA

`93b31892f95a2966a591cdb45825cf12e2603d11`

This is the exact application/test SHA used for the clean-clone and GitHub Actions gates.

## 4. Evidence SHA

`7f7827a034c171385ce861905aed814922390909`

This documentation-only commit records the UI text audit, verification matrix, visual QA results, and supervised-browser evidence policy.

## 5. Files changed

The implementation SHA changes 46 files: 399 insertions and 170 deletions. The change is limited to admin/public Vue presentation, shared UI CSS, navigation helpers, product contracts, and tests. Evidence and this report follow as documentation-only commits.

No dependency manifest, lockfile, `server/**`, `prisma/**`, migration, or shared-schema file changed.

## 6. Sidebar changes

- Removed every Workspace `<select>` and the collapsed selector popover.
- Expanded and mobile Sidebar Workspace rows now navigate to `/admin/workspaces`.
- Collapsed rail uses a direct link with the tooltip `ワークスペースを切り替える`.
- Current Map is static context and uses `マップ未作成` for a zero-Map Workspace.
- Product-logo routing, active navigation, disabled Real Map, drawer focus trap, Escape, focus return, and body scroll lock remain intact.

No Workspace or Map selector remains in the Sidebar.

## 7. Workspace List behavior

`/admin/workspaces` is the only new route. It reads the existing `GET /api/organizations`, shows all memberships with `オーナー` / `メンバー`, and marks the active Workspace with `使用中`.

Selecting the current Workspace returns through `/admin/dashboard` without a redundant POST. Selecting another Workspace uses the existing secure `POST /api/organizations/active`, then force-reloads `/admin/dashboard`, so old Map/Spot/Floor/editor context is not retained.

## 8. Focus system changes

- Keyboard links, buttons, summaries, navigation items, and non-field controls use a 2px Terracotta outline with 2px offset.
- Text fields, textareas, native selects, and the `UiSelect` field trigger use a Terracotta border plus a 3px soft `#fbe8e3` outer ring.
- The old global black 3px outline and duplicated component rings were removed.
- Browser-computed styles confirmed the canonical input and non-field treatments without double rings.

## 9. Vocabulary changes

Visible copy now consistently uses `ワークスペース`, `マップ`, `スポット`, `ピン`, `項目`, `変更申請` / `承認待ち`, `操作履歴`, `アクセス状況`, `公開`, `公開内容`, and `マップの位置合わせ` according to context.

CSV labels are action-oriented: `CSVでまとめて登録`, `CSVでまとめて編集`, and `CSVで書き出す`. `Digital Map` remains the product brand.

## 10. REVIEW_REQUIRED terms left unchanged

The following terms were documented and intentionally not reinterpreted: `フロア`, `イラストマップ`, `リアルマップ`, `カテゴリー`, `ピンの重要度`, and `ワークスペース`.

## 11. Route / API / schema preservation

- `/admin/workspaces` is the only new route; no existing route was removed or renamed.
- Existing organization APIs were reused without contract changes.
- `Tenant` remains the internal code/domain concept.
- Prisma schema, migrations, RBAC, persistence, analytics, publication, revision, CSV data contract, and one-Map-per-Tenant behavior are unchanged.
- Billing was not implemented.
- Real Map was not implemented; it remains disabled as `準備中`.

## 12. Automated test results

- Local regression without DB: 80 files passed, 3 skipped; 538 tests passed, 16 skipped.
- Local isolated PostgreSQL: 83 files passed; 554/554 tests passed.
- `pnpm typecheck`: PASS.
- Production build: PASS; existing chunk-size advisory only.
- `prisma validate`: PASS.
- Tenant data foundation audit: PASS, zero anomalies.
- IMAGE spatial audit: PASS, zero exceptions.
- Clean clone at implementation SHA: frozen install, 538 tests, typecheck, and build PASS.
- GitHub Actions Verify run `35493221472`: PASS at the implementation SHA.
- Final report/evidence Verify run `35493453757`: PASS.

## 13. Browser / visual / accessibility results

- Required 1280×800, 390×844, and 430×932 Sidebar and Workspace List views passed with no horizontal overflow.
- A disposable two-Workspace local fixture verified both switch directions, the zero-Map state, correct roles, and absence of stale cross-Tenant content.
- Workspace rows, Sidebar links, login/form fields, `UiSelect`, dialog focus entry/Escape/return, and mobile drawer focus/close behavior passed keyboard checks.
- Representative Home, Illustration Map, Spot, Category, Publish, Access status, Change requests, Workspace settings, Operation history, and CSV pages passed the terminology sweep.
- A fresh browser tab reported zero console warnings/errors.
- Existing automated accessibility/axe coverage passed.
- Open local P0/P1/core P2 defects: 0.

## 14. Windows QA result

**NOT EXECUTED — ACCEPTED / WAIVED RESIDUAL RISK.**

The configured `chiffonchan` SSH connection timed out because the product owner was away from the Windows QA machine's local Wi-Fi environment. No Windows backup, release deployment, database mutation, service restart, or Windows browser verification occurred.

On 2026-09-20 the product owner explicitly decided that the completed local, isolated PostgreSQL, browser, clean-clone, and CI results are sufficient for WU-51 and that Windows QA will not block this WU.

## 15. Open defects / residual risk

No implementation defect is open at P0, P1, or core P2.

Accepted residual risk:
- WU-51 implementation SHA `93b31892...` was not deployed or validated on the Windows QA host in this WU.

This is an explicit product-owner waiver, not a hidden or implied PASS.

## 16. main / Production status

- main was not merged.
- Production was not deployed or accessed.
- The implementation branch was pushed only to run CI.
- Windows QA was not changed.
