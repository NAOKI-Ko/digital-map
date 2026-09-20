# WU-52 verification matrix

Base: `73466a03cdf8ae130b5ed9613389f775c82589de`
Branch: `refactor/wu52-direct-manipulation-toast-csv-revision-20260920`

| Area | Evidence | Result |
| --- | --- | --- |
| Exact base | merge-base and HEAD recorded before changes; CI 35493833201 concluded success at the same SHA | PASS |
| Decoration | local draft, rAF updates, commit/rollback boundary, keyboard handles, command-only inspector | PASS |
| Toast | one host, keyed coalescing, timeout/dismiss/polite-vs-assertive regions | PASS |
| Select | `rg '<select' app/pages/admin app/components/admin` returned no matches | PASS |
| CSV v3 | functional round-trip and Floor safety tests; map-wide browser screen | PASS |
| Revision | structured server review, stale UI, Dialog, no JSON stringify | PASS |
| Local tests | 543 passed / 16 skipped without DB | PASS |
| PostgreSQL tests | 559/559 passed against isolated PostgreSQL 17 | PASS |
| Prisma | validate and generate | PASS |
| Data audits | Tenant Data Foundation and IMAGE spatial audits, zero anomalies | PASS |
| Typecheck | Nuxt typecheck | PASS |
| Production build | Nuxt/Nitro build | PASS (existing large-chunk warning) |
| Dependency audit | production, high threshold | PASS, no known vulnerabilities |
| Browser | desktop + 390×844 + 430×932, clean console | PASS for exercised flows |
| Windows | product-owner waiver | NOT EXECUTED / WAIVED |

No package, lockfile, Prisma schema, or migration change was introduced.
