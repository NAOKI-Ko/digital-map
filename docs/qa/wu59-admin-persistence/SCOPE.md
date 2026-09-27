# WU-59 approved route scope

Base: `8980521550625e724fcc0b2bda9c46d93eeb0023` (`origin/dev`). Derived from `docs/decisions/admin-ux-20260928/SCREEN-CONTRACT-MAP.md`, `FINDING-DISPOSITION.md`, and `IMPLEMENTATION-SEQUENCE.md` before product-code edits. This WU covers the nine Phase-1 routes, not the later Decoration geometry or Paper layout migration.

| Route | Current persistence | Contract | Required change | Finding IDs |
|---|---|---|---|---|
| `/admin/maps/:mapId/floors/:floorId/georeference` | Explicit point PATCH/DELETE; local draft, no route guard | VISUAL_DRAFT_SAVE for points; COMMAND_IMMEDIATE for remove | Saved snapshot/dirty guard; clarify Reset vs Cancel; preserve failed draft; feedback and busy guard | UX-001, UX-002, UX-005 |
| `/admin/maps/:mapId/settings` | Independent section saves and immediate language/delete; no route guard | FORM_EXPLICIT_SAVE per section; COMMAND_IMMEDIATE for operations | Section dirty snapshots, leave/section-switch protection, save/busy/feedback clarity | UX-001, UX-004, UX-005 |
| `/admin/organization` | Profile form save plus immediate members/invitations; no route guard | FORM_EXPLICIT_SAVE for profile; COMMAND_IMMEDIATE for team | Profile dirty guard and disabled unchanged Save; retain command model | UX-004, UX-005 |
| `/admin/maps/:mapId/fields` | Per-field save; in-page dirty dialog; no route guard | FORM_EXPLICIT_SAVE per field; COMMAND_IMMEDIATE for reorder/delete | Protect route leave and retain in-page transition behavior | UX-004 |
| `/admin/maps/:mapId/spots/:spotId` | SpotForm guarded; separate English translation save unguarded | FORM_EXPLICIT_SAVE for both independent scopes | Translation draft snapshot/guard; feedback and unchanged Save | UX-004, UX-005 |
| `/admin/maps/:mapId/categories` | Per-item form save; English name bound to canonical list before save | FORM_EXPLICIT_SAVE per item/translation; COMMAND_IMMEDIATE for order/delete | Separate English draft, route/target protection, feedback | UX-004, UX-012 |
| `/admin/spot-editor/:spotId` | Revision submit, no route guard | FORM_EXPLICIT_SAVE (submit revision); photo upload command | Guard meaningful form draft; busy/success/failure state | UX-004, UX-005 |
| `/admin/maps/:mapId/paper/:paperMapId` | Whole draft save/Reset/PDF-from-draft; guard, inline error only | VISUAL_DRAFT_SAVE; PDF output from current draft | Explicit success feedback, Reset wording/guard clarity, target/source switch review, duplicate-submit protection | UX-001, UX-005 |
| `/admin/maps/:mapId/editor` | Position/design draft saves and dirty guard; mixed feedback | VISUAL_DRAFT_SAVE; placement removal command | Harmonize save feedback, target-switch protection and pending states without layout change | UX-001, UX-005 |

**Excluded:** Decoration geometry migration and Paper Map Edit column reversal are Phase 2. Paper Map New remains a Selection/Preview flow. Publication vocabulary, navigation ownership and component consolidation are later phases. Shared primitives may be changed only to support the nine routes without altering unrelated behavior.
