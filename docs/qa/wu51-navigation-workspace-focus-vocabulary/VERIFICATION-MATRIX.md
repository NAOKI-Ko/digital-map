# WU-51 Verification Matrix

| Area | Contract | Verification |
| --- | --- | --- |
| Exact base | HEAD and merge-base are `a8ed7dcb8b98bb36b588f3a1b6973042fa583a07` | PASS (preflight) |
| Sidebar | No Workspace or Map select | PASS — automated source contract + browser inspection |
| Sidebar | Expanded/mobile Workspace row links to `/admin/workspaces` | PASS — automated source contract + responsive UAT |
| Sidebar | Collapsed rail uses direct link and tooltip | PASS — automated source contract + desktop UAT |
| Map context | Static label; `マップ未作成` fallback | PASS — automated source contract + switched-Workspace UAT |
| Workspace List | Shows every membership, role, and `使用中` | PASS — API-backed two-membership fixture at all required viewports |
| Switching | Existing active-organization API; hard return through dashboard | PASS — browser switched both directions with no stale map content |
| Current Workspace | Navigates without redundant switch POST | PASS — pure behavior test + browser UAT |
| Dirty state | Existing route-leave guard remains authoritative | PASS — existing unsaved-changes tests |
| Focus | Terracotta 2px control outline | PASS — CSS contract + computed browser styles |
| Fields | Terracotta border and soft outer ring; no double black outline | PASS — computed browser styles for native input and `UiSelect` |
| Copy | High-risk visible legacy terms normalized | PASS — text audit, source scan, route sweep, automated contract |
| Routes | Only `/admin/workspaces` added | PASS — route audit/build |
| APIs/schema | No server API, Prisma, migration, or RBAC changes | PASS — Git diff audit |
| Responsive | 1280×800, 390×844, 430×932 | PASS — browser screenshots/inspection; no horizontal overflow |
| Accessibility | Keyboard, focus, dialog/drawer behavior, axe | PASS — browser keyboard checks + automated axe suite |
| Clean clone | Frozen install, tests, typecheck, build at implementation SHA | PASS — `93b31892f95a2966a591cdb45825cf12e2603d11` |
| GitHub Actions | Verify workflow at implementation SHA | PASS — run `35493221472` |
| Final evidence CI | Final report/evidence verification | PASS — run `35493453757` |
| Windows QA | Backup, exact-SHA deployment, full gates, runtime/browser checks | **WAIVED / NOT EXECUTED** — product owner explicitly accepted this residual risk on 2026-09-20 because the Windows host was outside the reachable local network |

## Final gate status

**PASS-READY by explicit product-owner acceptance.**

All implementation-controlled local, isolated PostgreSQL, clean-clone, browser, accessibility, and GitHub Actions gates passed. Windows QA was not executed and is not represented as PASS. The product owner explicitly waived that environment-specific gate for WU-51 and accepted the remaining residual risk.

No Windows backup, release activation, service restart, database change, main merge, or Production deployment was performed.
