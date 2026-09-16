# WU-45 R1 + WU-46 R1 integrated QA evidence

Date: 2026-09-16 (Asia/Tokyo)

This directory records the integrated correction pass. The exact deployed SHA is the commit containing this file; the post-activation runtime state is recorded in the external integrated report.

## Baseline and lineage

- WU-44 reference: `99f7c423e5dd69fd39c93b85cf418650ec1e16d2`
- WU-45 first implementation: `a3b0594042e420b0f80073c033c228220d5b88aa`
- WU-46 first Windows deployment and selected baseline: `bc5c88b548dec16f65ad0c7863b26e1f05f4fe7e`
- Windows preflight active SHA: `bc5c88b548dec16f65ad0c7863b26e1f05f4fe7e`
- The selected baseline is a linear descendant of both historical references. No legitimate WU-45 or WU-46 change was discarded.
- Isolated branch/worktree: `feat/wu45-wu46-integrated-correction-20260916`

## Commit breakdown

- `69b0a84` — WU-45 R1 admin PIN workspace corrections.
- `360142e` — WU-46 R1 public-map mobile UX corrections.
- The containing commit adds integrated evidence only.

## WU-45 local browser evidence

The checks used a disposable local Spot fixture and did not touch the Windows database.

- At 1440 x 900, shared toolbar rect: x=104, y=225, width=1280, height=74.
- Map rect: x=104, y=311, width=630. Inspector rect: x=754, y=311, width=630. Their top coordinates and widths are equal (1:1).
- At 900 x 800, Map and Inspector each measured x=62.77, width=813.23 in the stacked layout; document scroll width remained 900.
- At 390 x 844, both measured x=42.61, width=331.39 in the stacked layout; document scroll width remained 390.
- Search and the Reka-backed Floor Select are in the shared toolbar. The prior Floor chip/tablist is absent.
- A local design draft changed the selected real Map PIN from persisted `#2563EB` to draft `#7C3AED` without persistence.
- Cancel restored the exact persisted blue design and retained the selected-PIN summary.
- A dirty Floor switch raised the project-standard `未保存の変更があります` guard.
- Fresh-load browser console after the explicit guard import: no warnings or errors.
- Screens were visually inspected in the controlled browser. The browser runner did not expose a durable screenshot file, so no screenshot artifact is claimed here.

## WU-46 local browser evidence

The public checks used a disposable two-public-Floor local snapshot at `/qa-wu46`.

- Mobile viewport: 390 x 844.
- Top-right app controls: x=263..378, y=12..56. Map controls after correction: x=333..379, y=69..209. No overlap.
- Category zone after correction: y=752..804. Attribution: y=805..833. No overlap.
- Category visible pills are 36 CSS px high inside 44 CSS px touch containers; text is 13 CSS px.
- Spot summary category zone: y=600..652. Summary sheet: y=672..844. No overlap.
- Explicit `詳細を見る` opened full detail. A long-detail fixture measured clientHeight=772 and scrollHeight=1036; it reached scrollTop=264 (the end), while the sticky close control remained visible at y=88..128. Close returned to the Map.
- Public Floor count was 2. Switching to 2F closed the selector, cleared detail, and left only the 2F Spot; switching back restored the 1F state.
- Category OR check: 食事 returned only `qa-spot-1`; 食事 + 買い物 returned `qa-spot-1` and `qa-spot-2`.
- Idle camera check ran for 73,138 ms; all three marker pixel coordinates were unchanged.
- Four zoom-out clicks at the computed minimum left all marker pixel coordinates unchanged.
- Desktop 1440 x 900: map controls x=1289..1429/y=67..113, categories x=368..1072/y=832..884, attribution x=1325..1429/y=861..889; zones did not overlap. The removed Spot-list CTA/text was absent.
- Fresh mobile and desktop console checks had no application errors.
- The controlled desktop browser did not provide a real iPhone Safari runtime or a location result. Real-iPhone Safari and end-to-end GPS/toast timing therefore remain explicitly unverified; deterministic request-state tests cover single-request suppression, new-request re-notification, exact message, and 5,000 ms duration.
- Screens were visually inspected in the controlled browser. The browser runner did not expose a durable screenshot file, so no screenshot artifact is claimed here.

## Automated validation

- Node.js `v24.19.0`.
- Nuxt build reported Nuxt `4.5.2`, Nitro `2.13.4`, Vite `8.3.0`, Vue `3.5.42`.
- Vitest `4.1.11`: 71 files passed, 490 tests passed.
- `nuxt typecheck`: passed.
- Prisma schema validation: passed.
- Prisma client generation: passed during setup.
- IMAGE spatial migration audit: passed with zero invalid floors, invalid references, partial Spots, outside Spots, or published unpositioned Spots.
- Production `nuxt build`: passed; only the existing large-chunk/plugin-timing warnings were emitted.
- `git diff --check`: passed.
- No schema migration was added.

## Windows preflight

- Host: `chiffonchan` / `C:\DigitalMap` QA only.
- Active SHA and release before mutation: `bc5c88b548dec16f65ad0c7863b26e1f05f4fe7e` / `C:\DigitalMap\releases\bc5c88b548dec16f65ad0c7863b26e1f05f4fe7e`.
- Public QA URL before activation: `https://sur-context-basin-concert.trycloudflare.com`.
- Deployment follows `C:\DigitalMap\DEPLOYMENT.md`: fresh verified backup, committed-source archive, frozen install, Prisma/audit/test/type/build gates, exact-SHA activation, Nuxt-only restart, and readiness checks.
- Previous releases and backups are preserved.

## Explicit limitations

- No approved disposable Windows admin write fixture exists, so Windows Move/Design Save/Cancel write scenarios must not mutate shared Spots and remain blocked.
- Real iPhone Safari is unavailable in this environment.
- Human UAT is not marked PASS by this evidence.
