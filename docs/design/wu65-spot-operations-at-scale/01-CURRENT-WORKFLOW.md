# Current workflow and evidence

Reviewed 2026-09-29 at `2b5178859e236e07965d6106dbfae22fa2984037` (`dev`). All descriptions in this document are current behavior; other documents explicitly propose changes.

## Evidence provenance

The requested `docs/audit/aquarium-admin-remediation-20260928/` is **absent from this dev commit**. All ten documents were read from the existing local audit workspace:

`/Users/naoki/Documents/Codex/2026-09-28/digital-map-aqua-uat-admin-remediation/repo/docs/audit/aquarium-admin-remediation-20260928/`

That checkout is at `2745c557844283b2b616a775dcfb2bd3b423e522`, and the audit directory is untracked there. It was not modified or represented as committed dev evidence. The audit itself reports that the original detailed Aquarium UAT bundle was unavailable. Thus 5 Floors, 37 Spots, 37 PINs, 6 Categories and three available photos are supplied workload evidence, not independently measured click logs or a fresh database inventory.

The five priority audit files have these SHA-256 hashes for reproducibility:

| File | SHA-256 |
|---|---|
| 05-SPOT-THROUGHPUT-AUDIT.md | `9e95bf59561d0c6ea4e965ec27cbe54b7a877990c0db35303e77ab1d6988d04a` |
| 06-CATEGORY-PIN-SEMANTICS.md | `6336aad0c982c0ce69bc083b4c54103f627b6ce234004c8ad6238e3db3d49a2a` |
| 07-SPOT-VOCABULARY-AUDIT.md | `11f7ea071127a8e31db21b3110676d60999bad8cff29e78a970fa4cc7c19a4e0` |
| 08-REMEDIATION-OPTIONS.md | `61b896b780a741ea203a4e20d44bf8a7da0a3e22183c43e119338e7a49845de4` |
| 09-RECOMMENDED-SEQUENCE.md | `9cc4b98ffa36c39d8e4a97b099fbbe1d22f59de4117060a3b3de6628b8734fe9` |

Source was inspected in a disposable `/tmp/wu65-source` checkout because the task workspace initially contained no repository. Its tracked files remained unchanged. Deliverables are in the task workspace at the requested repository-relative path; they are not a remote commit or PR.

## Pinned source inventory

All links below pin the exact reviewed commit; directory links identify inspected handlers/components. Symbols narrow the behavioral evidence without relying on shifting line numbers.

| Key | Source | Observed authority |
|---|---|---|
| E1 | [Prisma models](https://github.com/NAOKI-Ko/digital-map/blob/2b5178859e236e07965d6106dbfae22fa2984037/prisma/schema.prisma) | `Spot`, `Category`, `SpotCategory`, `MapFloor`, `SpotPhoto`, `SpotFieldDefinition`, `PublicRelease`. |
| E2 | [Spot List](https://github.com/NAOKI-Ko/digital-map/blob/2b5178859e236e07965d6106dbfae22fa2984037/app/pages/admin/maps/%5BmapId%5D/spots/index.vue), [list API](https://github.com/NAOKI-Ko/digital-map/blob/2b5178859e236e07965d6106dbfae22fa2984037/server/api/maps/%5BmapId%5D/spots/index.get.ts) | Filters, selections, displayed fields, unpaginated result and bulk toolbar. |
| E3 | [CSV utility](https://github.com/NAOKI-Ko/digital-map/blob/2b5178859e236e07965d6106dbfae22fa2984037/server/utils/spot-csv.ts), [CSV handlers](https://github.com/NAOKI-Ko/digital-map/tree/2b5178859e236e07965d6106dbfae22fa2984037/server/api/maps/%5BmapId%5D/spots/import), [v3 contract](https://github.com/NAOKI-Ko/digital-map/blob/2b5178859e236e07965d6106dbfae22fa2984037/docs/product-contracts/spot-csv-v3.md) | `spotCsvV3Columns`, `previewSpotCsv`, hashes, export and Serializable apply. |
| E4 | [bulk API](https://github.com/NAOKI-Ko/digital-map/blob/2b5178859e236e07965d6106dbfae22fa2984037/server/api/maps/%5BmapId%5D/spots/bulk.patch.ts), [bulk schema](https://github.com/NAOKI-Ko/digital-map/blob/2b5178859e236e07965d6106dbfae22fa2984037/shared/schemas/spot-bulk.ts), [Spot handlers](https://github.com/NAOKI-Ko/digital-map/tree/2b5178859e236e07965d6106dbfae22fa2984037/server/api/maps/%5BmapId%5D/spots/%5BspotId%5D) | Category add/remove, delete, publish/unpublish; position/design/photos/form writes. |
| E5 | [PIN Editor](https://github.com/NAOKI-Ko/digital-map/blob/2b5178859e236e07965d6106dbfae22fa2984037/app/pages/admin/maps/%5BmapId%5D/editor.vue), [SpotCombobox](https://github.com/NAOKI-Ko/digital-map/blob/2b5178859e236e07965d6106dbfae22fa2984037/app/components/admin/SpotCombobox.vue), [PIN schema](https://github.com/NAOKI-Ko/digital-map/blob/2b5178859e236e07965d6106dbfae22fa2984037/shared/schemas/pin-design.ts) | `finishSuccessfulSave`, mode/dirty guards, Floor retention, whole style tuple. |
| E6 | [MediaPicker](https://github.com/NAOKI-Ko/digital-map/blob/2b5178859e236e07965d6106dbfae22fa2984037/app/components/admin/MediaPicker.vue), [SpotPhotoManager](https://github.com/NAOKI-Ko/digital-map/blob/2b5178859e236e07965d6106dbfae22fa2984037/app/components/admin/SpotPhotoManager.vue) | Asset versus association, usage filtering, immediate photo commands, six-photo maximum. |
| E7 | [SpotForm](https://github.com/NAOKI-Ko/digital-map/blob/2b5178859e236e07965d6106dbfae22fa2984037/app/components/admin/SpotForm.vue), [New](https://github.com/NAOKI-Ko/digital-map/blob/2b5178859e236e07965d6106dbfae22fa2984037/app/pages/admin/maps/%5BmapId%5D/spots/new.vue), [Detail](https://github.com/NAOKI-Ko/digital-map/blob/2b5178859e236e07965d6106dbfae22fa2984037/app/pages/admin/maps/%5BmapId%5D/spots/%5BspotId%5D/index.vue), [field defaults](https://github.com/NAOKI-Ko/digital-map/blob/2b5178859e236e07965d6106dbfae22fa2984037/shared/constants/spot-fields.ts) | Form scope, transitions, labels and field configuration. |
| E8 | [Categories](https://github.com/NAOKI-Ko/digital-map/blob/2b5178859e236e07965d6106dbfae22fa2984037/app/pages/admin/maps/%5BmapId%5D/categories.vue), [public serializer](https://github.com/NAOKI-Ko/digital-map/blob/2b5178859e236e07965d6106dbfae22fa2984037/server/utils/public-map.ts) | Independent Category icon and Spot PIN fields. |
| E9 | [release builder](https://github.com/NAOKI-Ko/digital-map/blob/2b5178859e236e07965d6106dbfae22fa2984037/server/utils/public-release.ts), [visitor preview API](https://github.com/NAOKI-Ko/digital-map/blob/2b5178859e236e07965d6106dbfae22fa2984037/server/api/maps/%5BmapId%5D/visitor-preview.get.ts), [visitor renderer](https://github.com/NAOKI-Ko/digital-map/blob/2b5178859e236e07965d6106dbfae22fa2984037/app/components/map/VisitorMapExperience.vue) | Snapshot assets, authenticated LIVE source, shared visitor component. |
| E10 | [category filter](https://github.com/NAOKI-Ko/digital-map/blob/2b5178859e236e07965d6106dbfae22fa2984037/app/utils/category-filter.ts), [Paper source](https://github.com/NAOKI-Ko/digital-map/blob/2b5178859e236e07965d6106dbfae22fa2984037/server/utils/paper-map.ts), [Paper document](https://github.com/NAOKI-Ko/digital-map/blob/2b5178859e236e07965d6106dbfae22fa2984037/shared/utils/paper-map-document.ts), [editorial renderer](https://github.com/NAOKI-Ko/digital-map/blob/2b5178859e236e07965d6106dbfae22fa2984037/server/utils/paper-map-editorial-renderer.ts) | OR filter; all memberships for selection/text, Category icons for print badge. |
| E11 | [product contracts](https://github.com/NAOKI-Ko/digital-map/tree/2b5178859e236e07965d6106dbfae22fa2984037/docs/product-contracts), [AGENTS.md](https://github.com/NAOKI-Ko/digital-map/blob/2b5178859e236e07965d6106dbfae22fa2984037/AGENTS.md) | Explicit/visual Save and command models; navigation ownership; publication vocabulary; no separate PIN entity. |

## Current objects and operations

- Spot requires one `floorId`; x/y are nullable normalized illustration coordinates, lat/lng are separate nullable real-map coordinates. There is no independent Placement entity. Floor holds illustration and optional two-point georeference. An unplaced Spot still belongs to a Floor.
- SpotCategory is many-to-many with zero memberships permitted. Category has name/order/icon but no PIN color/default. Spot owns `pinIconType`, `pinIconId`, image URL/asset, color, size and independent importance. Current default is preset, null icon (renders fallback ●), `#C7401F`, medium, normal importance.
- Spot New edits name, Floor, categories and enabled content fields, optionally lat/lng. It supports duplicate-name warning. Successful normal creation navigates to Detail; PIN-origin creation returns to the originating editor Floor/camera with selected Spot.
- Detail separately saves core fields and translations, exposes photos in a collapsed section, publication-target commands, and a PIN Editor link. Photo additions/order/removal save as individual commands; core form Save does not save all sections.
- List supports keyword/category/Floor/eligibility/placement filters and sorting; row checkbox, count, select-all-current, category add/remove, target on/off, delete. No Floor/style/custom-field bulk actions. API cap is 100 selected IDs, despite an unpaginated list. Selection is not cleared by a filter watcher today; scope needs clearer handling.
- Bulk target-on rejects the entire request when any selected Spot lacks x/y. Both single and bulk eligibility gates inspect **x/y**, not lat/lng. Some messages and AGENTS prose say lat/lng; implementation is behavioral truth. Public serialization likewise requires isPublished plus x/y. Real-only placement does not satisfy this gate.
- General Spot PATCH permits a valid Floor with submitted coordinates; it does not itself implement a safe cross-Floor transfer policy. CSV correctly prohibits existing-row Floor change. WU-65 must not reuse the general PATCH as a bulk transfer shortcut.
- Position DELETE clears x/y and turns target off, preserving content; position PATCH saves x/y. Neither is an automatic public release update.
- CSV v3 already handles new-row Floor, categories, configured structured fields and translations. New Spots have no position and are target-excluded. Export is Map-wide. Existing-row IDs and hashes protect identity/content conflicts; apply revalidates inside a Serializable transaction. See [04](04-CSV-RESPONSIBILITY.md).

## PIN Editor: actual 37-item throughput

Unplaced selection is already restricted to the current Floor and searchable by Spot name/category (component also matches Floor). A separate positioned search exists. Arrow keys/Enter operate the combobox; Escape leaves visual modes through dirty protection. Selecting an unplaced item does not itself enter placement: choose it, start placement, click candidate, explicitly save. After a successful save, `finishSuccessfulSave` refreshes, clears selection and retains the Floor query. There is **no next-unplaced queue or auto-advance**. Placement and design have separate modes and saves, with failed candidates retained and request-context gates. Floor/camera are not intentionally reset between same-Floor saves; floor switch clears camera context. Retention and focus behavior need browser verification, not claims of measured speed.

## Differences from older audit wording

1. WU-64 visitor Preview now exists. The older audit's “missing visitor preview” is obsolete for this SHA; do not implement AQUA-011 again.
2. `MediaPicker` has recent/Map/all scopes and usage filters, **not a text-search input**. The older audit's “searches/filters” overstates current capability. Newly uploaded but unused assets can be hidden by its photo-usage filter; expose All uses when assigning photos.
3. Paper editorial cards currently choose `categories[0]` for a small badge, while category text and selection use multiple memberships. That is an existing Paper presentation shortcut, not a valid PIN precedence rule. No Paper template change here.
4. Structured import and basic bulk already reduce workload today. The replay must compare both a manual path and the current best CSV/bulk path, not credit all savings to WU-65.

No runtime, data mutation, Windows QA or browser UAT was executed in this design pass. Source inspection substantiates current control flow; workflow counts are conditional estimates.
