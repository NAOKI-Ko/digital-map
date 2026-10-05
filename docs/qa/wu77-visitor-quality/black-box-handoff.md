# WU-77 independent black-box candidate packet

Prepared2026-10-05; updated after the16:05UTC owned-connection recovery. This packet is a test entrypoint, not Acceptance. Implementation authors' screenshots/source review do not establish independent QA PASS.

Current repair candidate: `94ca6d75f30a6f5960d1e6df5d0dccab81547c0b`. Windows loopback3016 / Mac loopback58123 at `http://127.0.0.1:58123/__qa_wu77_visitor`; coincident fixture `http://127.0.0.1:58123/__qa_wu68_coincident`. [Fresh connection/source attestations](replay/windows-serving-restored-94ca6d7.json) record all1364 source hashes/F1, owned listeners, both Mac API24+12/PNG and HTML responses. Executor transport loss removed the Mac forwards; only the two owned forwards were re-established, without restarting either Windows runtime or changing canonical/other forwards. Candidate Macforward PID77791 expires19:14UTC; Windows foreground started15:16:03UTC and expires around19:16UTC. Notify root before extending/stopping. CI828 PASS/1 existing skip; Windows noDB796 PASS/33 DB-dependent skips and build/typecheck/Prisma/security pass. Details and retained failure history are in implementation-record.md.

True old UI is `http://127.0.0.1:3015/__qa_wu77_visitor_baseline`, source `d35f39eaa17f8412684bf5c00e8444c0d1fdd2cb` (9403 product plus harness/PNG, before the feature). Fresh all1322 hashes, owned listener, API24+12 and PNG passed. Macforward PID78187 expires17:20UTC; Windows old-runtime lease expires around17:22UTC. Use this old UI for the fixed side-by-side. Candidate `_baseline` helpers share the new shell and do not establish old-product behavior.

Independent round1 on9d2 is NO-GO with WU77-BB-001/002. Retest BB001 at1024×768 and1440×900 cold/Overview/Detail-return/Tab focus, then all five fixed A/B viewports. Retest BB002 count3→spiderfy→each member Detail→Escape/pointer close, native focus/selected ring, normal/reduced motion and keyboard. Verify priority recovers when focus leaves. No fixture explanation waives these findings. Authenticated LIVE, persisted publication, full maxZoom/AT/performance and fixed-rubric Acceptance remain outstanding.

Draft PR33 targets dev. Current product source is94ca; later docs-only commits do not replace the physically served source. Original9d2 gates/QA failure history remain in implementation-record.md and Git history. A production-build runtime with isolated actual data/auth remains pending; its existing9d2 build copy must receive a separately attested final-candidate update before final parity Acceptance.

## Fixed comparison

Follow `benchmark-lock.md` without changing URL/task/viewports/rubric. B1 is the official Nagoya Aquarium/JERA map, the same product; it is not two benchmark scores. B2 is the old Arimatsu public map. Its20spots/onefloor cannot establish facility/floor success. Official selection-map image is not verified official Detail evidence.

- candidate synthetic URL: `http://127.0.0.1:58123/__qa_wu77_visitor` through the restored owned SSH loopback forward to Windows3016.
- fixture JSON SHA256: `36e5ea87d9a3297a99821c6e4ad6d2860f9763b611070a0ff3f299090ccf3ffd`.
- floor PNG SHA256: `dd51f2177020810b69e2b5298c3cb4d3278013863fd50fbe6f869af8c058b2c9`.
- old product F1: `baseline/fixed-fixture/`, five overview images plus equipment Category/Detail/floor interactions. Rendered on f8615de source with only d35f39e's identical-artwork PNG compatibility repair.
- `__qa_wu77_visitor_baseline` on the candidate is only a legacy-preset rendering aid. It shares the new shell; it cannot replace the old source baseline3015 or its screenshots.
- dev-only API returns a self-authored fixed public DTO and never touches a database. These routes404 in the production build. Synthetic fixture does not prove saved authoring, publication or authenticated parity.

## Mandatory findings and evidence

Use390×844→430×932→768×1024→1024×768→1440×900, preserve camera in the prescribed sequence, and record actual CSS viewport. RunT1–T9 against the locked reference and candidate. Score each of14axes with evidence; unknown/NA are not PASS. Report clear disadvantage even if aggregate appearance improves.

Author `candidate/` captures include five resized overview views and an additional390 cold view. Creating the tab at a default desktop size before resizing preserved a different camera from390 cold startup. Do not treat these as completed five-size cold benchmark evidence. Independent QA should start at390 before loading or reload once at390, then follow the locked resize sequence; repeat the old-source baseline when its camera precondition is insufficient. Keep the explicit overview-control result separate from initial-camera evidence.

Check facilities' eight explicit presets, old material/kanji/custom/illustration compatibility, selected/focused/Category/featured priority, painted geometry versus60×60target, count/staged zoom/maxZoom spiderfy/offscreen representative, reachable members and focus after Detail close. Check Floor and Category state/counts, tablet controls versus Detail, long content/200%zoom, keyboard/AT semantics, reduced motion, warm/cold and rapid interaction stability.

Use the [fixed WU68/70 fixture declaration manifest](replay/wu68-70-fixture-manifest-94ca6d7.json) for route URLs, source hashes, intentional shapes, expected/observed API counts and observation times. Dense/coincident/near/priority/recovery-floors/groups/broad/dateline/empty/invalid/geometry/motion are declared; the API responses were checked on58123. Those shape/reachability checks establish no browser/collision/motion/a11y or full-maxZoom PASS. Intentional shape cannot waive a user-facing Finding. Retain exact interaction evidence; any runtime error, image failure, focus loss or hidden unreachable member is a Finding. AT/device tests and browser emulation must be labeled separately.

Actual saved-data Public/LIVE parity requires a normal authenticated browser session against the approved isolated persisted candidate and a same-source public snapshot. The [Windows本人console handoff](operator-console-handoff.md) is a separate unfinished auth preparation gate. Do not share credentials in evidence. Active3011 remains SHA9403d32 and is preserved; it does not represent this candidate. No production/main changes are authorized.

Parent DOT owns independent competitive QA and Final Quality Acceptance. Return P0/P1/P2 and reasonable quality-related P3 for repair. Do not CompleteWU77 while mandatory axes remain untested or below the locked bar.
