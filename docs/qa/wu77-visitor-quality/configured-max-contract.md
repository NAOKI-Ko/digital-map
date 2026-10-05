# Public visitor configured max and collision fixture contract

The absolute supported zoom domain is 0..24. Public visitor floor limits are viewport/floor dependent: minimum = max(0, min(24, fitted zoom) − 1); maximum = max(minimum, min(24, max(0, initial zoom) + 6)). **24 is an absolute cap, not every fixture's configured maximum.** Floor switch refreshes that floor's bounds; ordinary resize keeps the camera. Initial camera/Overview remain existing explicit actions. The displayed camera attestation includes current zoom/min/max and is read-only observation; no direct camera setter should substitute for user controls.

At a configured maximum, any collision group with >=2 members must allow every member to be selected via spiderfy, with the count retained, native 60x60 targets, selected/focused identity retained on return. A nonexact near group must reach its configured boundary through ordinary zoom/group activation. Exact coincident groups may spiderfy before the boundary, so their successful expansion alone does not prove the max branch. Reduced motion changes animation duration, not reachability.

Use `/__qa_wu68_near` for boundary coverage: 3 IDs `wu68-00`, `wu68-01`, `wu68-02`; normalized positions x=.5, .500001, .500002 and y=.5; category memberships empty. Small/medium/large respectively, first featured. The 3-member near group should remain collision-bearing at its cap. Capture cap/plateau through ordinary + controls, activate its count, then test all three members with pointer and keyboard, Detail close/Escape and own focus/count restoration. Repeat 390x844 and 1440x900, normal/reduced motion. Record an unexpected separation or missing count as an observation, not a waived fixture.

Other fixed groups: coincident3 at identical(.5,.5); groups6 is two groups of3 at x=.2/.8,y=.5, all medium; priority3 is x=.506/.5/.512,y=.5, first normal/other two featured, all medium; recovery-floors has 3 identical members on each of two floors. Priority groups can separate before maximum and are a distinct staged-zoom/representative/selection test.

Actual browser 200% zoom requires the browser's zoom state and changed CSS viewport to be recorded; resizing a viewport or applying page-scale emulation alone is not that result. Previous broken key delivery on the test harness remains a tool observation, not a product finding or PASS.


The fixed fixture shapes and configured limits are unchanged. These contracts are expected behavior, not claims of complete QA or Quality Acceptance.
