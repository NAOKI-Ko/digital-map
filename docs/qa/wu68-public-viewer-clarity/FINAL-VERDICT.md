# FINAL VERDICT — PARTIAL / NOT ACCEPTED

Implementation and all review P2 fixes are complete. Required audit/Verify is FAIL because patched node-forge>=1.4.1 is not obtainable from official npm. No audit exception or gate relaxation. PR27 remains OPEN/unmerged. Post-merge Verify, Windows exact-SHA activation, authenticated LIVE Preview and Final Acceptance are pending. Parent WU remains incomplete.

## SHA / review evidence

- Base dev:34c8b901a8dfd11a871e7f83e1c65bdae9ecbbb8
- User-authorized revision base:8522ddadbae5fd2a8388b7110b5bc55fb37adaf8
- Final implementation:2e636a3ddd6d4cbefb4c99558a0a1e023aa83687
- Final evidence SHA:PR27 current head (documentation-only follow-up)
- Merged SHA:none; dev remains base above
- Windows remains4a90be0186666a0e2007029da85e5a0846539e2a; backups verified, no activation
- Production/main remainsa58b4353bd108e6586f329080c772f69b8aaffda
- PR:https://github.com/NAOKI-Ko/digital-map/pull/27

Original3 P2s plus5 additional P2s fixed and all8 threads resolved. Codex re-review of final implementation2e636a3 completed2026-10-02T02:53:29.694884Z with no additional threads/findings. Re-review request:https://github.com/NAOKI-Ko/digital-map/pull/27#issuecomment-5944686771. Implementation Verify36957419742 FAIL only at mandatory production dependency audit. No forced merge.

## All20 Acceptance Criteria

| AC | Status | Criterion | Evidence/limit |
|---|---|---|---|
| 1 | PASS | 390px高密度Mapの重なり解消 | 初期4 PIN、実矩形+10px gap。 |
| 2 | PASS | selected PIN常時表示 | selected非抑制。focus中PINも非抑制。 |
| 3 | PASS | active Category優先 | priority testsとfilter実画面。 |
| 4 | PASS | featured > normal | priority testsとdense実画面。 |
| 5 | PASS | 同順位stable | ID順。入力逆順でも同じ集合。 |
| 6 | PASS | zoom in再表示 | 390px4→9。近接で分離不能なSpotは詳細ナビで回復。 |
| 7 | PASS | zoom out再抑制 | 5サイズで初期集合へ戻る。 |
| 8 | PASS | presentation-only | 入力不変テスト・公開JSON不変。座標/Category/importance/snapshot変更なし。 |
| 9 | PASS | 非表示PIN focus除外 | inert/tabindex=-1。focus中PINは消えない。 |
| 10 | PASS | 初期camera原則20°/0° | Primary dense20°/0°。空/invalid/broad fallbackはlevel0°/0°。 |
| 11 | PASS | 初期zoomを寄せる | Primary390:whole-floor+0.65。contentがそのfitに収まらない場合はsafe fallback。 |
| 12 | PASS | zoom安全上限 | +0.65 cap。fit zoomを最小値へ強制引き上げない。 |
| 13 | PASS | Floor切替同じpolicy | 25 cases:15 valid-content20°、10 mobile broad fallback0°。 |
| 14 | PASS | filter/detail/resizeでresetなし | detail最小pan完了後のclose/resizeでcenter/zoom完全保持。 |
| 15 | PASS | overview0°/0°whole-floor | overview後のcompass復帰も0°。5サイズと25Floor cases。 |
| 16 | PASS | 指定5サイズ主要フロー | dense/near recovery/fallback/多Floor実画面。 |
| 17 | PASS | dense outdoor・multi-floor回帰 | dense36 Spot、5Floor×5サイズ。 |
| 18 | PARTIAL | Public/LIVE Preview parity | 同一renderer実装維持。認証済み実画面未確認。 |
| 19 | FAIL | tests/type/build/Prisma/Verify | 696 PASS/1任意SKIP、typecheck/build/Prisma PASS。audit/Verify FAIL。 |
| 20 | PASS | Production untouched | main/dev未merge。Windows未activation。 |

Totals18 PASS /1 PARTIAL /1 FAIL. PASS refers to tested local implementation, not pending exact-SHA Windows acceptance.

## 390px before/after and behavior

Before evidence/390-before.jpg:wu68-00…35 all36 rendered despite density hidden attribute (display:flex override). bearing0/pitch0; zoom14.609707646398311; center lng136.97123594617784,lat35.068358034016384.

After evidence/390-after.jpg:wu68-00/03/18/21; zero overlaps including10px gap. bearing0/pitch20; zoom15.259707646398311(+.65); center lng136.97076018598818,lat35.06792808243404. Zoom+1 reveals00/03/05/12/15/17/24/27/29. Category still collision-limited. Selected always displayed; focused never suppressed by density/collision.

The detail navigation provides access to exact-coordinate and all actual screen-overlapping neighbors, including nearby coordinates inseparable at maximum allowed zoom. Measured rectangles include density-hidden candidate geometry; recovery IDs intersect currently published/Category-visible Floor Spots. No new cluster/search UI, Spot offset or canonical write. Five maxZoom fixtures show only00, then01/02 are reachable by Enter/click. evidence/p2-round3-near.json and p2-near-max-390.jpg.

Collision:stable greedy O(n²), selected > active Category > featured > normal, stable Spot-ID ties; selected/focus are protected. requestAnimationFrame coalesces scale writes→one geometry pass→visibility writes. Target and scaled/rotated artwork union+10px gap. Hidden PINs inert/tabindex-1/aria-hidden. Collision does not rebuild marker DOM. Shared Public/LIVE renderer.

Initial camera:unfiltered Floor Spot bounds+.08 padding, converted through existing georeference. Longitudes unwrap relative to the first corner at180°. Eligible content camera never exceeds whole-floor+.65 or its fitted zoom. Content unable to fit at discovery minimum+.55 uses a level whole-floor fallback, as do empty/invalid/extreme bounds. Navigation home follows actual initial policy; explicit overview establishes0° home.

Overview:0°/0°whole-floor; Primary zoom14.609707646398311 at390×844. Rotation then compass keeps level fit. After user zoom16.25970764639831, filter preserveszoom, detail performs only existing minimal panel-avoidance pan, and close/passive height resize preserve center lng136.970660312797,lat35.06646128712622 and zoom exactly. evidence/p2-round3-dense.json.

Dense initial/zoom-in/zoom-out for390×844,768×1024,1024×768,1440×1000,1440×700:4/9/4,9/36/9,9/36/9,22/36/22,9/34/9. Zero non-protected overlaps/focus eligibility violations. Additional20 cases(empty/invalid/broad/dateline×five sizes)verifycontain, initial compass and heading recovery. Multi-floor25 cases verifyinitial/zoom/overview/Category/detail.

## Security and remaining Public Viewer debt

Official npm node-forge latest is1.4.0; version1.4.1 endpoint HTTP404 and pnpm returnsERR_PNPM_PACKAGE_NOT_FOUND. Published stable versions have none>=1.4.1. Latest upstream listhen1.10.1 still depends on^1.4.0. Same-major refresh removed the other advisories; one high remains(GHSA-86w9-cpqp-85rv). No failing/unresolvable override, audit ignore, crypto patch or gate change has been committed. A published patched dependency is needed before merge can proceed.

Remaining debt:
- Authenticated LIVE Preview browser parity and exact merged-SHA Windows acceptance remain pending. Existing QA credential-source use was previously rejected by automatic approval review for missing explicit source authorization; no bypass or retry with another credential path.
- Mobile broad all-normal Floors(390/768)initially use level fallback and suppress normal PINs. Zoom+1 reveals11/4/6/9/7, or Category selection provides direct access; detail and overview PASS. This initial discovery limitation remains explicit.1024/1440 cases use20° and initially show11/4/6/9/7.
- Generic dense discovery requires zoom/recovery detail navigation; no cluster/search by scope.
- Category candidate DOM rebuild and existing current-location/georeference limitations remain; collision itself preserves DOM.
- Stale Windows public tunnel pointer needs reconciliation before external-link QA.

Production untouched. No schema/migration, publication, coordinates, Category or importance mutation. Windows backup/digest evidence is inWINDOWS-QA.md. Resume only after patched dependency→audit/Verify PASS→merge dev→post-merge Verify→exact-SHA Windows QA→authenticated Preview→Final Acceptance.
