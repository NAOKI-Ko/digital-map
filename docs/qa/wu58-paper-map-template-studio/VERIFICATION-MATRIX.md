# Verification matrix

| Area | Evidence | Status |
|---|---|---|
| v1→v2 migration/version failure | `tests/paper-map-easy-builder.test.ts` | PASS |
| suitability/switch/content retention | same | PASS |
| shared geometry/render templates | unit + PDF tests | PASS |
| A4/A3, portrait/landscape | `tests/paper-map-pdf.test.ts` | PASS |
| RBAC/reference validation | API source assertions + existing access suite | PASS |
| full unit suite (PostgreSQL) | 589 tests passed | PASS |
| typecheck | Nuxt typecheck | PASS |
| production build | Nuxt build (only pre-existing chunk-size warnings) | PASS |
| dependency security | `pnpm audit --prod --audit-level high` | PASS |
| visual targets | three inspected PNG/PDF pairs | PASS |
| authenticated browser matrix | editor + picker at five requested viewport sizes | PASS |
| PostgreSQL migrations | all 31 migrations on disposable database | PASS |
| tenant/image/paper-map/default-field audits | disposable PostgreSQL database | PASS |
| clean clone / GitHub Actions | requires commit and push | PENDING |
