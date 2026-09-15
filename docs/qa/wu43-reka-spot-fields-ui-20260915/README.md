# WU-43 QA evidence — Reka UI foundation and Spot Fields redesign

Date: 2026-09-15 (Asia/Tokyo)

Verdict: **PASS-READY**. Human UAT remains separate and was not marked PASS.

## Source and release

- Actual clean baseline: `da9f98d13e15cad19b3165a4c259c74b284fb4c0`
- Implementation SHA deployed for browser QA: `5eefaf50dc220159357c7871d9d440efa88995da`
- Branch: `feat/wu43-reka-spot-fields-ui-20260915`
- This evidence file is committed after implementation QA; the exact evidence/final-release SHA is recorded in the external completion report and Windows runtime metadata.
- Reka UI: `2.10.4`
- No GitHub push, main merge, Production deployment, or schema migration was performed.

The baseline was recovered from the clean accepted WU-42 source history and matched the Windows active SHA. The unrelated dirty `/Users/naoki/digital-map` checkout was not modified.

## Reka migration inventory

### Migrated now

- `UiSelect`: Reka Select portal/popper/collision behavior, trigger-related width, viewport height constraint, stable option values, disabled options, keyboard and Escape behavior.
- `UiSwitch`: Reka Switch root/thumb with visible labels and screen-reader state.
- `UiDialog`: Reka Dialog portal, overlay, title, focus containment, Escape, and focus return.
- `UiAlertDialog`: Reka AlertDialog with explicit cancel/destructive actions and focus management.
- `AppDialog` now delegates to `UiDialog`.
- `ConfirmDialog` now delegates to `UiAlertDialog`.
- Spot Fields add flow, custom field type selector, state controls, and dirty-state confirmation use the wrappers.
- Category edit dialog was used as the shared-dialog regression surface.

### Still custom

- `SpotCombobox` and PIN workspace search combobox behavior.
- Native selects in admin navigation, Spot forms/list filters, CSV import, assignee/editor assignment, media picker, paper export, and public locale selection.
- Contextual menus not needed by this WU remain on their existing implementations.

### Recommended next

1. Migrate `SpotCombobox` and PIN search popups after focused positioning/keyboard regression tests.
2. Migrate high-use admin filter selects, beginning with Spot list and Spot form floor/category selectors.
3. Migrate media picker and paper export selects where popup clipping is observable.

## Spot Fields result

- Compact collapsed rows expose drag handle, display name, standard/custom, field type, enabled/public/required states, usage count/state, and Edit.
- Exactly one row expands into the editor.
- The existing optional English name remains functional and visually secondary.
- Save updates the summary and collapses the row; Cancel restores the original draft.
- Dirty switching offers Save, Discard, and Cancel without silent loss.
- Standard deletion/type restrictions and in-use custom restrictions remain in force.
- Add field is next to the page heading and uses the Reka dialog/select/switches.
- Raw order numbers are not exposed.
- HTML drag-and-drop and keyboard-capable Up/Down controls persist order through a transactional reorder endpoint; reload preserved the exact order.

## Automated validation

- Focused tests: `3 files / 26 tests` PASS.
- Full suite: `68 files / 460 tests` PASS.
- Standalone typecheck: PASS.
- Prisma validate: PASS.
- Prisma generate (`7.10.0`): PASS.
- IMAGE spatial audit: PASS, zero unresolved exceptions.
- Production build: PASS.
- `git diff --check`: PASS.
- Frozen lockfile install: PASS locally and on Windows after disabling the unnecessary `vue-demi` install hook in the workspace allowlist.

## Local browser QA

- Compact overview with 10+ fields: PASS.
- Add/select/switch/dialog focus and Escape behavior: PASS.
- Single expanded editor, Save, Cancel, dirty Save/Discard/Cancel: PASS.
- Accessible reorder, drag reorder, persistence after reload: PASS.
- Temporary field created for the flow was removed after QA.
- Shared Category dialog Escape/focus-return regression: PASS.
- Browser console errors: 0.

Popup measurements (CSS pixels):

| Scenario | Trigger | Popup | Overflow |
| --- | --- | --- | --- |
| 1280×720 | x 472–808, y 346–390 | x 472–808, y 396–606 | 0 |
| 900×800 | x 282–618, y 386–430 | x 282–618, y 436–646 | 0 |
| 390×844 | x 36–354, y 382–426 | x 36–354, y 432–642 | 0 |
| Scrolled page | trigger top 542 | popup above, bottom 536 | 0 |
| Open during resize | width matched at about 277 | stayed attached above | 0 |

Sidebar collapse/expand retained alignment. Mobile rows stacked without horizontal overflow and kept Edit/reorder controls reachable.

## Windows backup and deployment

- Previous active SHA: `da9f98d13e15cad19b3165a4c259c74b284fb4c0`
- Browser-QA implementation SHA: `5eefaf50dc220159357c7871d9d440efa88995da`
- Release: `C:\DigitalMap\releases\5eefaf50dc220159357c7871d9d440efa88995da`
- Backup: `C:\DigitalMap\backups\pre-wu43-reka-fields-096c6bc-20260915-151111`
- DB dump: `C:\DigitalMap\backups\pre-wu43-reka-fields-096c6bc-20260915-151111\db\digital-map-20260915T061112Z.dump`
- Media snapshot: `C:\DigitalMap\backups\pre-wu43-reka-fields-096c6bc-20260915-151111\media\20260915T061113Z`
- Runtime/config metadata and `SHA256SUMS.txt`: present; backup verification PASS.
- All older backups and releases were preserved.
- Frozen install, Prisma validate/generate, IMAGE audit, 460 tests, typecheck, and build passed before activation.
- Database schema reported up to date with 28 existing migrations; no WU-43 migration was added.
- Activation used a release-by-SHA directory and Nuxt-only restart.
- Health: `ok`; readiness: `ready`; PostgreSQL: running; cloudflared: running.
- QA URL: `https://sur-context-basin-concert.trycloudflare.com/`

The first candidate (`096c6bc`) failed its pre-activation frozen install because the QA `NODE_OPTIONS` preload conflicted with the `vue-demi` postinstall hook. It never activated; the active WU-42 release remained intact. The corrected workspace allowlist was committed and all gates passed before activation.

## Windows browser QA

- Spot Fields compact overview, add, expanded edit, switches, Save/Cancel, dirty guard, usage state, accessible reorder, reload persistence: PASS.
- Temporary `WU43 Windows QA` field was created, exercised, then removed by exact ID after verifying it had zero values; final UI count was zero.
- Desktop popup: trigger x 472–808 / popup x 472–808, 6px gap, overflow 0.
- 900×800 popup: trigger x 282–618 / popup x 282–618, 6px gap, overflow 0.
- 390×844 popup: trigger x 36–354 / popup x 36–354, 6px gap, overflow 0.
- Open-popup resize to 1000×700 retained equal 336px width, 6px gap, and overflow 0.
- Keyboard/Escape and focus return: PASS.
- Regression smoke: PIN workspace, Floors, Spot list, Spot detail, Publish, and public map PASS.
- Browser console errors: 0.

Local browser QA additionally covered page scroll, sidebar toggle, drag reorder, and Cancel draft restoration. No regression appeared in Windows smoke testing.

## Severity and limits

- P0: 0
- P1: 0
- Core P2: 0
- P3: 0 recorded
- Multilingual behavior was not implemented; WU-44 remains the owner of that work.
- Human UAT remains pending/separate.
- Screenshots were not persisted by the browser tool; the accessibility observations, exact popup geometry, command results, and runtime paths above are the retained evidence.
