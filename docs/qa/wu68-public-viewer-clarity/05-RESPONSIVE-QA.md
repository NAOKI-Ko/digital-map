# Responsive QA
Chrome real viewport overrides: 390×844 / 768×1024 / 1024×768 / 1440×1000 / 1440×700.
High density initial visible counts: 4 / 9 / 9 / 22 / 9. All actual rendered target/artwork rectangles have zero collisions including 10px gap. Initial bearing0/pitch20; zoom bounded at fit+.65. Native zoom reveals additional candidates; zoom-out suppresses again. Filter leaves camera unchanged, collision active. Overview resets to bearing0/pitch0 and contains all projected corners. Hidden focus-invalid count 0 across states.
All-normal multi-floor Aquarium: all 25 Floor×viewport combinations PASS selection/detail close/Floor switch/overview; initial PIN counts at390: 10/4/6/9/7, desktop11/4/6/9/7. Initial increments .55–.65, pitch20; collision count0 everywhere.
Primary visual: PINs no longer collapse into a block. Map art spans the mobile viewport width; Spot area is emphasized; controls and Category are usable. Remaining whitespace reflects the Floor illustration aspect ratio under the deliberate capped camera policy, rather than an unbounded cover zoom.
Raw evidence: responsive.json and multi-floor.json; screenshots in evidence/.

## 68-09 current QA

390×844 /768×1024 /1024×768 /1440×900 /1440×700 verified:Map-only zoom recovery, exact and near/maxZoom spiderfy, Enter/Escape, zoom/pan/Category/Floor/background close, priority and center winner, safe camera fallback and overview.50 scenario records and5 initial actual-geometry measurements; zero initial overlaps at10px gap and hidden-interactive violations. Initial dense counts4/9/10/18/9; representative zoom counts9/36/36/36/34; another zoom all36. Historical Detail recovery is superseded by08-MAP-ONLY-RECOVERY-QA.md.
