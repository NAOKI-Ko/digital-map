# Compatibility, proposed migration and rollback

This document specifies future work only. No Prisma changes or migration files are created in WU-65. Decisions D1–D4 require an additive schema change; D5 Floor intent does not require a new field. Source: [01 E1/E4/E8/E9](01-CURRENT-WORKFLOW.md).

## Proposed persistent changes

| Area | Proposed addition | Default / invariant |
|---|---|---|
| Category | Nullable complete PIN-default fields (same validated type/icon/asset/color/size vocabulary), and a style revision | Absent on existing Categories; separate from Category icon. Asset ownership/references required. |
| Spot | Source mode and nullable chosen visual Category FK | Database/legacy writer fallback **individual**, preserving existing tuple. Updated new-create/import paths explicitly set **standard**. |
| Spot explicit tuple | Reuse existing PIN columns | Authoritative only for individual mode; never infer mode from values matching a Category. |
| Source membership | Same-Map and assigned-Category invariant | Category mode requires non-null source; standard requires null; individual may retain a valid member source as reset target. |
| Concurrency | Category revision plus existing Spot liveVersion / relevant dependency checks | Default/source/membership writes invalidate stale dependent drafts/revisions. |
| Media relations | Category-default asset relation / usage tracking | Separate from existing Category icon asset; authorized assets cannot be deleted as “unused” while referenced by defaults. |
| Floor/readiness/publication | No new fields | Existing floorId is pre-placement intent; status derived; target remains current isPublished after x/y. |

Use structured nullable fields and database constraints where practical, plus transactional cross-relation validation; exact migration syntax is implementation work. Complete tuple means no partial default or per-field fallthrough. Category source deletion should be restricted at FK level rather than `SetNull` silently repainting a PIN. Existing membership deletion paths also require validation because membership is a join relation, not guaranteed by a simple Category FK.

## Compatibility matrix

| Existing case | Behavior after additive rollout |
|---|---|
| Aquarium's existing 37 Spots/PINs | Every PIN remains individual with identical style/coordinates/Floor/target state; zero auto-adoption. Staff may later explicitly preview/adopt shared defaults, preserving exceptions. |
| Arimatsu Maps | All existing custom and ordinary styles and retail field labels remain intact. No map-type detection or inferred intent. |
| Existing Categories/icons | Continue filters/legends unchanged; PIN default remains absent. Configuring a new default has no effect on individual/standard records. |
| Custom or illustration PINs | Preserve original type, image URL/asset, color/size and importance. Do not normalize into preset icons as migration. Asset resolution retains legacy fallback. |
| Multiple Categories | Membership/order remains; no selected visual Category inferred. Legacy visual stays individual. |
| No Category | Valid as before; legacy individual or new standard. No publication block added. |
| Existing CSV v3 | Same columns, types and identity rules; style/geometry/photos/target untouched. Category removal that would violate a newly opted-in source now blocks explicitly. |
| v2/v1 legacy CSV | Preserve current acceptance/rejection matrix; no promise to accept previously unsupported Map-wide new rows. |
| Existing public releases and Paper PUBLISHED source | Byte-stable stored snapshots/assets; no migration/resolution from current defaults on read. Historical restore remains historical output. |
| Pending assigned-editor revisions | Remain restricted content editing; a source-category removal must not bypass safety during approval. Changed relevant versions force re-review; no silent approval overwrite. |

Preserving source-reference invariants is a necessary **visible validation tightening** for newly inherited records, not silent interpretation of old visuals. Existing untouched individual/no-source records retain old CSV semantics.

## Incremental rollout

1. **Expand with compatibility defaults.** Add nullable Category default fields, revision, Spot source mode defaulting to individual, and nullable FK. Backfill nothing from classification or visual equality. Capture representative legacy API/release outputs before activation. Do not change current release pointer.
2. **Deploy a compatible reader and all writers together before activation.** Introduce shared resolver; legacy individual branch must match prior serialization. Gate source UI/default writes until create/import/form/design/bulk/category delete/membership/revision approval and media usage paths enforce invariants. Update old clients with conflict/version responses rather than accepting stale whole-style payloads silently.
3. **Enable explicit adoption.** Updated creators choose standard by default; existing Spot modes stay individual. Operators configure optional Category PIN defaults and explicitly elect category mode via a reviewed source command. Adoption writes neither coordinates nor target state. A Category icon edit is never adoption.
4. **Resolve release snapshots.** The builder captures a consistent set of content plus style versions (transactional read or validated revision set) before asset copying. A default edit during construction must cause retry/failure rather than mixed old/new styles across Floors or locales. Store resolved existing PIN fields and immutable assets, not only a live source reference.
5. **Verify before exposure.** Validate legacy pixels/tuples, new live inheritance, current release stability, source-deletion checks and media access. Only then expose bulk source controls and continuous queue as completed features.

Default changes should advance affected category-mode Spots' liveVersion (not individual PINs) in the same transaction, or an equivalent explicitly tested dependency-token mechanism. Choose the direct dependent-version increment for the initial bounded Map scale. Source reset targets in individual mode need membership validation but do not require repainting/version fanout on default edits. CSV's existing content hash stays content-scoped; source constraints are checked against current state at apply independently.

## Rollback

Additive columns may remain in place on an application rollback; do not drop them automatically. Before **any inheritance activation**, rollback to old application code is safe because all effective legacy tuples still reside on Spot and no dependent styles exist.

After activation, an old reader would ignore source fields and show stale explicit tuples for inherited records. Therefore **blind application rollback is unsafe**. Preferred rollback is to the last compatible reader with source editing disabled. If an older reader is unavoidable: stop writes, back up source metadata/defaults, transactionally resolve every standard/category-mode record into its existing Spot tuple and change it to individual, preserve all images, verify old serializer equivalence, then roll back code. This freezes current LIVE visuals and loses dynamic inheritance until deliberately restored from retained metadata; it must not restore an old DB backup over newer user content. Never mutate published release snapshots or pointer as part of this fallback.

A release rollback is separate: it selects a historical public snapshot and does not undo LIVE Category/source edits. Explain this distinction to operators.

## Media, privacy and cross-surface guarantees

Default images participate in tenant ownership validation, usage counts/deletion protection and release asset rewriting. No visitor request reaches private MediaAsset/Category tables to resolve a PIN. Current public API still reads a ready public snapshot; authenticated LIVE Preview remains role-scoped and private/no-store. Paper consumes the same resolved source contract where shared; no Paper template migration or source-selection redesign.

## Risks and mitigation

- **Unexpected group repaint:** no automatic legacy adoption; default Save shows affected inherited records, exceptions and changed count.
- **Stale pending edit:** relevant versions checked transactionally across source/default/membership and approvals.
- **Broken source:** reject membership/category removal before commit, with explicit reset/freeze path.
- **Coordinate loss:** bulk Floor only fully coordinate-free/target-off; reject whole mixed request.
- **Old writers / rollbacks:** feature activation gate and compatible-reader rollback path.
- **Public drift:** resolve at release build and snapshot assets; no live inheritance in historical output.
- **Second taxonomy burden:** visual choice is a Category reference, not a new semantic classification system.

No open product decision remains; schema constraint syntax, query batching and UI component factoring are engineering details to verify in the implementation slices.
