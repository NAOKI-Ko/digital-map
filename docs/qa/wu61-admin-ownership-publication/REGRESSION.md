# Regression and technical gates

- API and Prisma schema: unchanged. No migration or authorization change.
- Publication state machine and release endpoints: unchanged; existing commands were exercised on disposable data.
- WU-59 draft and navigation guards remain mounted on Paper, PIN, and Georeference. Paper source inspection was discarded without saving; public release commands did not modify their draft mechanisms.
- WU-60 Paper Preview-left/Inspector-right and Decoration Canvas-left/Controls-right layout code: unchanged.
- Paper Preview/PDF rendering: code unchanged; only source labels and readiness presentation changed.
- Public Map visual UI: code unchanged; browser comparison of editable Map name versus retained visitor release verified snapshot separation.
- Spot publication flag is now described as eligibility, with placement and Map visibility caveats; underlying `isPublished` behavior is unchanged.

## Gates

| Gate | Result |
|---|---|
| Full Vitest suite | PASS: 90 files, 618 tests; 3 files / 16 tests skipped |
| Nuxt typecheck | PASS |
| Nuxt production build | PASS |
| Prisma validate | PASS |
| Read-only Paper Map Easy Builder audit on disposable clone | PASS: 1 config parsed, no invalid requests/configs |
| Read-only default Spot fields audit on disposable clone | FAIL: inherited WU-59 QA fixture has one custom field and lacks six standard semantic fields; no WU-61 field schema/data change |

The Spot field audit reports fixture content, not a regression in this PR. The disposable clone was not repaired merely to make the audit green. This limits the audit evidence for default field seeding; application tests, typecheck, build, and Paper audit passed.
