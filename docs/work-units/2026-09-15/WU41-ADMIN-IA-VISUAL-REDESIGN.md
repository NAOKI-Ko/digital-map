# WU-41 Admin IA / Visual Redesign

Asana Task GID: `1218476931754232`  
Date: 2026-09-15

## Git baseline

- Source worktree: `/Users/naoki/Documents/Codex/2026-09-14/digital-map-wu-23-through-wu/work/digital-map`
- Isolated worktree: `/Users/naoki/Documents/Codex/2026-09-15/wu41-admin-ia-visual-redesign/work/digital-map`
- Branch: `feat/wu41-admin-ia-visual-redesign-20260915`
- Base SHA: `e75325a11f66b226962307ed41e2584452b55fcc`
- Source worktree was clean before branch creation.

## Scope

- Central permission-aware navigation model
- Collapsed desktop rail, expanded sidebar, and accessible mobile drawer
- Organization and URL-authoritative current Map context
- Route-backed Map and Spot subnavigation
- New Map Home and fixed-query summary API
- Organization dashboard and adjacent admin visual refinement
- MapLibre resize integration
- Focused and full regression validation

## Safety constraints

- No schema migration planned.
- No Jira or Asana mutation by Codex.
- No push, main merge, Windows QA deployment, Production access, or shared DB access.
- WU-40 worktree and rollback artifacts remain untouched.

## Execution log

- 2026-09-15: Verified clean source worktree and actual base SHA.
- 2026-09-15: Created isolated WU-41 branch/worktree.
- 2026-09-15: Recorded route, IA, responsive, accessibility, visual, data, and security decisions before implementation.
- 2026-09-15: Added the permission-aware Navigation Rail/sidebar, Organization and URL-authoritative Map context, route-backed subnavigation, and MapLibre resize signaling.
- 2026-09-15: Added `/admin/maps/:mapId` Map Home, its fixed-query summary API, and a compact Organization dashboard.
- 2026-09-15: Verified OWNER, Map EDITOR, and Spot Editor navigation with local-only synthetic fixtures in an isolated PostgreSQL container.
- 2026-09-15: Added regression coverage and completed focused tests, the full test suite, typecheck, Prisma validation, production build, and browser QA.

## Validation

### Automated

- `pnpm exec vitest run tests/admin-navigation.test.ts tests/map-home.test.ts tests/admin-shell-accessibility.test.ts tests/unsaved-changes.test.ts tests/spot-list-navigation.test.ts tests/rbac-route-contract.test.ts`: PASS, 6 files / 26 tests.
- `pnpm test`: PASS, 65 files / 427 tests.
- `pnpm typecheck`: PASS.
- `pnpm prisma validate`: PASS.
- `pnpm build`: PASS. The existing large client chunk advisory remains a non-blocking build warning.
- `git diff --check`: PASS.

### Local browser QA

Environment: `http://127.0.0.1:3410`, isolated local PostgreSQL fixture data only.

- Desktop, 1280 × 720, OWNER: Organization dashboard, Map cards, collapsed rail, expanded sidebar, current Organization/Map selectors, Map Home metrics, next actions, and empty activity state rendered correctly.
- Desktop, 1280 × 720, Map EDITOR: assigned Map context and Map destinations rendered; OWNER-only member, audit, Organization settings, and editor-management destinations were absent.
- Desktop, 1280 × 720, Spot Editor: no Map management context was exposed; `担当Spot` appeared only with an actual assignment and opened the existing Spot Editor route.
- Mobile, 390 × 844: desktop navigation was replaced by a modal drawer; backdrop, 44px controls, initial focus, Escape dismissal, and focus return to the trigger were verified.
- Browser console errors: 0.
- Desktop rail/sidebar transitions and the mobile breakpoint were visually reviewed using the local in-app browser. Captures were transient QA observations; durable evidence is the contract/test set listed below.

### Evidence paths

- IA and visual decisions: `docs/design/WU41-ADMIN-IA-VISUAL-DESIGN.md`
- Navigation and role contracts: `tests/admin-navigation.test.ts`
- Shell, accessibility, MapLibre resize, and Publish/PDF contracts: `tests/admin-shell-accessibility.test.ts`
- Summary authorization, tenant/Map scoping, fixed query count, and safe activity payload: `tests/map-home.test.ts`
- Existing dirty-form protection: `tests/unsaved-changes.test.ts`
- Existing Spot deep-link behavior: `tests/spot-list-navigation.test.ts`
- Existing server-side route authorization: `tests/rbac-route-contract.test.ts`

## Security review

- Map Home begins with the shared Map access guard and performs no summary query before authorization succeeds.
- Every summary query is scoped to the authorized `tenantId` and `mapId`; cross-Tenant and unassigned Map access are rejected by the shared guard.
- The endpoint uses a fixed six-query summary plan, returns no audit metadata, exposes no actor email, and caps recent activity at five items.
- `Cache-Control: private, no-store` is set on the summary response.
- Public URL is returned only for a published Map with a ready current release.
- Sidebar persistence stores presentation state only. It does not persist tenant, Map, role, or permission state.

## Git checkpoints

- `25c51b4` — Docs: WU41管理画面IAとVisual設計を定義
- `84b883b` — Feat: 管理画面Navigation RailとMapコンテキストを追加
- `90b7ec3` — Feat: Map Homeと運用Summaryを追加
- `e6bafdf` — Improve: 管理画面DashboardとVisual品質を刷新
- `b3c3dff` — Test: WU41管理画面Regressionを追加
