# WU-65 integration and Windows QA evidence

Date: 2026-09-29 (JST). Production/main is excluded.

## Exact revisions and integration

- Base: `2b5178859e236e07965d6106dbfae22fa2984037`.
- Frozen design import: `796426b` (all eleven files unchanged).
- 65A: `5fc8456`; 65B: `8982369`; 65C: `d532e1e`; 65D implementation head: `cea5827313ad1c0e55308edd9f4c7ec303892cff`.
- [Implementation PR #18](https://github.com/NAOKI-Ko/digital-map/pull/18), merged into dev with merge commit `46d9961ea3a5a500738ba33fa0755b41c555afd8`.
- Verify PASS: [feature](https://github.com/NAOKI-Ko/digital-map/actions/runs/36482831785), [PR](https://github.com/NAOKI-Ko/digital-map/actions/runs/36482893424), [post-merge](https://github.com/NAOKI-Ko/digital-map/actions/runs/36483372095).

## Windows preparation and migration

Exact merged source archived and expanded into `C:\DigitalMap\releases\46d9961ea3a5a500738ba33fa0755b41c555afd8`. Existing native Node/PostgreSQL installation and Nitro preload retained. No Docker/WSL/firewall changes.

Verified backup root: `C:\DigitalMap\backups\wu65-pre-cea5827` (name uses implementation head; deployed archive uses the merge SHA).

- DB: `db\digital-map-20260928T210137Z.dump`.
- Media: `media\20260928T210139Z`.
- Public storage: `public\20260928T210141Z`.
- Backup checksum verification PASS. Private backups and credentials are not committed.
- Schema validation, pre/post spatial audit, tenant and Paper audits PASS.
- Additive migration deploy PASS; no legacy adoption or coordinate rewrite.
- Windows dedicated test DB `digital_map_test_wu65_46d9961`: 665 tests passed, one conditional private-backup comparison skipped. That comparison separately passed on approved isolated Mac before/after clones at 65B.
- Windows typecheck PASS.

The Windows legacy baseline compares all 90 existing Spot raw appearance/coordinates/importance/eligibility tuples, 20 Category icon records, nine Map publication references and a hash of all public-storage files. It also requires every legacy Spot to remain `individual` with no source Category. The exact baseline digest is `4b0dc77748567f08ff7079f7388832e911321ef2bd2eb92bced4036849316c44`; post-migration comparison PASS. This is data and renderer-equivalence evidence, not a claim of pixel-by-pixel screenshot comparison. Aquarium 37 and Arimatsu 52 are included; no existing Map is used for mutating replay.

## Rollback

Before any operator adopts CATEGORY, reverting the runtime pointer to the previous SHA leaves additive columns unused and preserves legacy behavior; keep the database migration applied. After adoption, old code would ignore source metadata: resolve/freeze inherited appearances before code rollback, or restore the coordinated pre-WU65 DB/media/public backup after reviewing changes made since backup. Never simply drop the columns or restore only the DB while leaving mismatched publication files. Stop only the QA Nuxt process during activation/rollback; PostgreSQL and the existing public tunnel stay running.

## Activation and Windows browser replay — PASS

- Windows build PASS. Nuxt alone restarted on exact merge SHA `46d9961ea3a5a500738ba33fa0755b41c555afd8`. PostgreSQL and Cloudflare tunnel remained running. Local HTTP PASS, public HTTPS 200; landing page rendered in a real browser with no page errors.
- The legacy comparison above also passed immediately before activation, after activation, and after isolated replay. Existing Aquarium/Arimatsu content, styles, coordinates and current releases were not adopted or republished.
- Mutating Windows browser replay used **only** `digital_map_test_wu65`, private `isolated-replay/uploads` and `isolated-replay/public` directories, and localhost port 3066 forwarded over SSH. Startup asserted those exact isolation paths. This is distinct from the deployed QA app/database on port 3011.
- Windows synthetic fixture: five Floors, six Categories, 37 Spots, with one multi-category Spot. Starter schema is Map-specific: the Mac CSV schema fingerprint was correctly rejected, then the Windows starter supplied its own metadata. CSV creation and export→preview produced 37 created / 37 unchanged respectively.
- Reviewed explicit Category-source adoption changed all 37 Spots. No category-order inference.
- Real canvas clicks and Save-and-next placed 8/8/7/7/7 Spots in five separate Floor sessions. All 37 saves succeeded; each queue ended on its current Floor. Publication targets remained OFF throughout placement. This distribution is synthetic, not a claim about original Aquarium Floor counts.
- Reviewed target-on affected all 37. Release `cmulra2vv0014wsva85vi0ni6` froze blue PINs; changing the Category default to green changed all 37 LIVE Preview PINs while the public JSON remained byte-equivalent. A bulk Floor assignment containing placed Spots was rejected with 409.
- Three individual photo choices were made through the list's named photo panels; three Spots have one photo, 34 have none. The final isolated release `cmulrcxdr001dwsvacqfxydhh` contains 37 green PINs and three photos. No browser page errors in the final flow.
- [Windows LIVE Preview](evidence/65d-windows-preview.png) and [Spot List after individual photos](evidence/65d-windows-list.png).

The replay required no Spot Detail visits for repeated classification, intended Floor, style-source or publication-target decisions. Human work remains 37 spatial decisions, three photo choices, and exceptional content. The initial structured data was supplied by CSV; placement was not imported or automated from coordinates.

## Scope and residual limitations

All received 65A–65D gates and frozen D1–D10 decisions are implemented and verified. The implementation message was truncated at section 35, and the continuation was requested but not received. This evidence does not claim to verify additional, unseen requirements. No unresolved product decision was needed for the received scope.

The post-deployment evidence is documentation-only on the same WU branch. The deployed application SHA above intentionally identifies the tested product merge, independently of subsequent evidence commits. No Paper template redesign, AQUA-006 Content/Placement separation, AQUA-007 visitor redesign, preset system, generic completeness score, or production deployment was included.
