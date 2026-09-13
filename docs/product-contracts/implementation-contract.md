# Phase 1 Implementation Contract

Date: 2026-09-13

## Authority and scope

This contract records the fixed Phase 1 product decisions. Authority order is: the Supervisor batch contract and later Supervisor decisions, these product-contract files, referenced PdM decisions, repository documentation, then existing implementation. Existing code is evidence, not authority to change these semantics.

Implementation may choose internal modules, helpers, safe constraints/indexes, test organization, and explicitly implementation-defined algorithms. It must not redesign UX or domain semantics, broaden Phase 1, invent migration data, delete user data, reset a database, deploy, touch production or the Windows QA server, or introduce unrelated cleanup.

## Cross-cutting invariants

- Illustration/IMAGE Spot placement is normalized image `x/y`, never Spot-level latitude/longitude.
- Floor georeference is optional and maps IMAGE coordinates to GEO coordinates using two corresponding points.
- Tenant Media Library assets are tenant/organization scoped and reusable across Maps and consumers.
- Spot fields are configured by Map-scoped Field Definitions; name, media, categories, PIN, placement, and publication are not custom fields.
- Real/GEO Map is visible but disabled with `今後対応予定`; its persistence, editor, viewer, placement, and publication are excluded.
- Decoration is an IMAGE-relative visual object, not a Spot.
- Public APIs expose only published Maps and published, positioned Spots, and never leak disabled/internal fields.
- Migrations preserve user-visible data and file bytes, use additive/backfill/controlled-removal ordering, never guess, and fail explicitly on unresolved data.

## Phase 1 exclusions

Phase 1 does not implement Real/GEO Maps, automatic image-content alignment or feature matching, Spot geographic coordinates as canonical IMAGE placement, four-corner/free georeference transforms, arbitrary transform handles, GEO Decoration, text/animated/clickable/grouped Decoration, custom fields of select/multi-select/date/time, CSV update/upsert/delete/sync, a Map-private Custom PIN library, arbitrary PIN pixel sizes, user-facing density thresholds, or custom PIN crop editing.

## Delivery and validation

Each work unit is a separate commit and must have focused tests, full tests, and typecheck green before commit. Phase boundaries additionally require Prisma validation and a production build. The final batch additionally requires frozen dependency integrity, migration sanity, source audits, documentation synchronization, and Human QA coverage. No push, merge, deploy, history rewrite, or force push is authorized.

## Hard-stop behavior

When deterministic preservation is impossible, work stops with the conflicting schema/behavior, exact affected paths, affected data, reason, and minimum Supervisor decision. The 2026-09-13 migration resolution further requires a reusable read-only IMAGE spatial preflight and explicit operator remediation for unresolved legacy rows.
