# Expanded WU-65 instruction reconciliation

Date: 2026-09-29. Expanded instructions received after implementation, integration and Windows QA acceptance. Received text ends at §8.3, “Allow user to stop/change target deliberately”; continuation requested. This reconciliation covers only received requirements.

## Preflight and immutable history

- Original dev / original implementation BASE_SHA: `2b5178859e236e07965d6106dbfae22fa2984037`.
- Exact eleven approved design files recovered and committed unchanged **first**, at `796426b`.
- **Standalone design-doc merge SHA: none.** The earlier implementation instruction required the first WU commit to preserve the design, and preferred one WU branch/PR. Accordingly design + four separately reviewable logical slices merged together through PR #18 at `46d9961ea3a5a500738ba33fa0755b41c555afd8`.
- The newly received requirement to merge a documentation-only design PR *before* implementation was not followed historically. It cannot be satisfied retroactively without falsifying/reordering recorded history. We neither rewrite the frozen files nor rebase/squash evidence. Their exact content is already in dev; original-source byte comparison remains 11/11 identical.
- Prior evidence merge/current reconciliation BASE_SHA: `ab32d35e390b9f662a7ed64aa1f28be0cb7c0778`. Its post-merge [Verify passed](https://github.com/NAOKI-Ko/digital-map/actions/runs/36486605739).
- Fresh fetch: HEAD and origin/dev both equal that SHA; clean initial status; no open PRs. Recent delta from original base comprises WU-65 design, 65A–65D and evidence only.
- Worktrees: `/private/tmp/wu65-source` on old `dev` base; `/private/tmp/wu65-implementation` clean isolated feature worktree reused for reconciliation. Unrelated canonical checkout untouched.
- Windows tested product SHA remains `46d9961ea3a5a500738ba33fa0755b41c555afd8`; subsequent differences are documentation/screenshots only. The reconciliation also adds explicit valid/conflict/zero-skip counts to the bulk review UI, so its follow-up product SHA must be built and deployed after verification.

## Requirement map

| Received section | Result and evidence |
| --- | --- |
| §0–1 mission / D1–D10 | Implemented; frozen decisions preserved. No new product decision, Placement entity, preset, Wizard, readiness score or out-of-scope renderer work. |
| §2 design first | Exact files preserved and verified. Historical standalone-first-PR ordering exception above; not represented as PASS. |
| §3 preflight | Recorded above and in original PREFLIGHT.md. |
| §4 independently reviewable slices | Four logical commits with sequential gates, one original implementation PR per prior instructions. New text permits this, although it prefers sequential PRs. |
| §5 foundation | Requested five-file evidence set added at [wu65a-foundation](../wu65a-foundation/SCOPE.md). CSV publication boundary explicitly documented. |
| §6 Category/PIN | Requested eight-file evidence set added at [wu65b-category-pin](../wu65b-category-pin/SCHEMA.md). Includes asset lifetime, real Aquarium/Arimatsu migration parity and complete release A/B scenario. |
| §7 bulk | Requested eight-file evidence set added at [wu65c-bulk-operations](../wu65c-bulk-operations/SCOPE.md). Atomic rejection means no skipped/partial successes; counts distinguish valid/conflict/change/no-op states. |
| §8.1–8.3 placement | Floor queue, actual human canvas clicks, explicit Save-and-next, source preview and deliberate stop/change supported. Existing draft guard wraps Floor changes, stop, skip and target changes. Success path refreshes authoritative records before advancing; failed save retains candidate. See 65D-LOCAL-REPLAY.md and Windows evidence. |

Explicit reviewed “use each sole Category” is an operator-chosen bulk command, not implicit source selection on creation or membership changes. Multiple/zero memberships block that command; selecting a named source requires membership in every row. No ordering rule is used.

## Verification provenance and remaining scope

Existing evidence is reorganized, not regenerated as fictional per-file browser sessions. §7.4 exposed one UI gap: aggregate valid/conflict/zero-skip counts were not displayed, although row conflicts and atomic rejection already worked. The follow-up adds these counts and an explicit all-unapplied explanation; mutation semantics are unchanged. Original 65A did not separately record build/Prisma validation before 65B; complete product subsequently passed both in local/CI/Windows gates. Final current-dev command results are recorded below after execution.

No historical tests or Windows migration are repeated merely to manufacture a different slice chronology. Product compatibility and release immutability remain backed by the original disposable-clone and Windows results. Production is untouched. Requirements beyond the received §8.3 ending are not claimed complete.

Current-dev reconciliation verification on `ab32d35e390b9f662a7ed64aa1f28be0cb7c0778`: `pnpm prisma:validate`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `git diff --check` PASS. This test invocation ran 649 tests with 17 conditional skips; it is not a new execution of DB-backed integration coverage. The previously recorded 665-test Windows/isolated integration run and separately executed private-backup equivalence test remain the integration evidence. Inventory checks confirm the requested 5/8/8 QA documents and eleven byte-identical approved design documents.

After the §7.4 UI correction, typecheck, 649-test non-integration run (17 conditional skips), build and whitespace checks passed again. Built-app browser review of 37 selected synthetic rows showed **適用可能 36件 · 要解消 1件 · 自動除外 0件**, explicit all-37-unapplied text, and disabled Apply. No mutation was submitted. [Screenshot](evidence/reconcile-bulk-counts.png).
